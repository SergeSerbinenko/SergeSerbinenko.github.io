
let app = require("express")();
let express = require("express");
let http = require("http").Server(app);
let io = require("socket.io")(http);
let fs = require("fs");
let schedule = require("node-schedule");
const readline = require('readline');
const {google} = require('googleapis');
let tasklistID = "MTA2MTc2Mzc3ODgyMDI3MTY5NDc6MDow";
let spreadsheetID = "1nuMycBUy3GzFs9LP88LaM9uic-xkpsCpgJWo-7PY3fE";
let today = new Date();
let dd = today.getDate();
let mm = today.getMonth()+1;
let yyyy = today.getFullYear();
if(dd<10) {
  dd = "0"+dd;
}
if(mm<10) {
  mm = "0"+mm;
}
let todayDateFormat = yyyy + "/" + mm + "/" + dd;
let currentDate = new Date();
let currentDateFormat = todayDateFormat;
let currentSetDay = today.getDate();
let tasks = [];
let userContent;
let todayRow;
let alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
let events = [];
let currentDayValues;
let start_time;

// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/tasks', "https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/calendar"];
const TOKEN_PATH = 'credentials.json';



// Load client secrets from a local file.
fs.readFile('client_secret.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  userContent = JSON.parse(content);
  // Authorize a client with credentials, then call the Google Slides API.
  authorize(JSON.parse(content), listTaskLists);
});


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 * @return {function} if error in reading credentials.json asks for a new one.
 */
function authorize(credentials, callback, argument, argument2, argument3) {
  const client_secret = credentials.web.client_secret;
  const client_id = credentials.web.client_id;
  const redirect_uris = ["http://localhost:3000"];
  let token = {};
  let refreshToken;
  const oAuth2Client = new google.auth.OAuth2(
       client_id, client_secret, redirect_uris[0]);

   fs.readFile(TOKEN_PATH, (err, token) => {
     if (err) return getNewToken(oAuth2Client, callback);
     oAuth2Client.setCredentials(JSON.parse(token));
     if(token.refresh_token == undefined) {
       let refreshToken = JSON.parse(fs.readFileSync("refresh_token.json"));
       oAuth2Client.setCredentials({
         refresh_token: refreshToken
       });
     }
     oAuth2Client.refreshAccessToken();
     if(argument && argument2 && argument3) {
       callback(oAuth2Client, argument, argument2, argument3);
     } else if (argument && argument2){
       callback(oAuth2Client, argument, argument2);
     } else if(argument) {
       callback(oAuth2Client, argument)
     } else {
       callback(oAuth2Client);
     }
   });
 }

 /**
  * Get and store new token after prompting for user authorization, and then
  * execute the given callback with the authorized OAuth2 client.
  * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
  * @param {getEventsCallback} callback The callback for the authorized client.
  */
 function getNewToken(oAuth2Client, callback) {
   const authUrl = oAuth2Client.generateAuthUrl({
     access_type: 'offline',
     scope: SCOPES,
   });
   console.log('Authorize this app by visiting this url:', authUrl);
   const rl = readline.createInterface({
     input: process.stdin,
     output: process.stdout,
   });
   rl.question('Enter the code from that page here: ', (code) => {
     rl.close();
     oAuth2Client.getToken(code, (err, token) => {
       if (err) return callback(err);
       oAuth2Client.setCredentials(token);
       // Store the token to disk for later program executions
       fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
         if (err) console.error(err);
         console.log('Token stored to', TOKEN_PATH);
       });
       if(token.refresh_token) {
         fs.writeFile("refresh_token.json", JSON.stringify(token.refresh_token), (err) => {
           console.log("refresh token saved");
         });
       }
       callback(oAuth2Client);
     });
   });
 }

 /**
  * Lists the user's first 10 task lists.
  *
  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
  */
 function listTaskLists(auth) {
   const service = google.tasks({version: 'v1', auth});
   service.tasks.list({
     tasklist: tasklistID
   }, (err, {data}) => {
     if (err) return console.error('The API returned an error: ' + err);
     tasks = [];
     for(let i = 0; i < data.items.length; i++) {
       if(data.items[i].status == "needsAction") {
         tasks.push(data.items[i].title);
       }
     }
   });
 }

 function changeTask(auth, task, taskData) {
   const service = google.tasks({version: "v1", auth});
   let currentTask;
   let needActionTasks = [];
   service.tasks.list({
     tasklist: tasklistID
   }, (err, {data}) => {
     for(var i = 0; i < data.items.length; i++) {
       if(data.items[i].status == "needsAction") {
         needActionTasks.push(data.items[i]);
       }
     }
     currentTask = needActionTasks[task];
     currentTask.title = taskData
     authorize(userContent, updateTask, currentTask);
   });
 }

 function updateTask(auth, userTask, taskData) {
   const service = google.tasks({version: "v1", auth});
   service.tasks.patch({
     tasklist: tasklistID,
     task: userTask.id,
     resource: {
       title: userTask.title
     }
   }, (err, {data}) => {
     if(err) {
       console.log(err);
     }
   });
 }

 function addTask(auth) {
   const service = google.tasks({version: "v1", auth});
   let needActionTasks = [];
   service.tasks.list({
     tasklist: tasklistID
   }, (err, {data}) => {
     for(let i = 0; i < data.items.length; i++) {
       if(data.items[i].status == "needsAction") {
         needActionTasks.push(data.items[i]);
       }
     }
     let previousId = needActionTasks[needActionTasks.length - 1].id
     service.tasks.insert({
       tasklist: tasklistID,
       previous: previousId,
       resource: {
         status: "needsAction"
       }
     });
   });
 }

 function removeTask(auth, id) {
   const service = google.tasks({version: "v1", auth});
   let needActionTasks = [];
   service.tasks.list({
     tasklist: tasklistID
   }, (err, {data}) => {
     for(let i = 0; i < data.items.length; i++) {
       if(data.items[i].status == "needsAction") {
         needActionTasks.push(data.items[i]);
       }
     }
     let removedTask = needActionTasks[id].id;
     service.tasks.delete({
       tasklist: tasklistID,
       task: removedTask
     });
   });
 }

 function getTodayRow(auth, hourValue, hourIndex, func) {
   const service = google.sheets({version: "v4", auth});
   service.spreadsheets.values.get({
     spreadsheetId: spreadsheetID,
     range: "A1:A366"
   }, (err, result) => {
     if(err){
       console.log(err);
     } else {
       for(let i = 0; i < result.data.values.length; i++) {
           if(result.data.values[i][0] == currentDateFormat) {
            todayRow = i+1;
            if(func == 1) {
              let data = {
                todayRow: todayRow,
                hourValue: hourValue,
                hourIndex: hourIndex
              }
              authorize(userContent, changeHour, data);
            } else if(func == 2) {
              let data = {
                todayRow: todayRow
              }
              authorize(userContent, getCurrentDay, data);
            }
          }
       }
     }
   });
 }

 function getEvents(auth) {
   const calendar = google.calendar({version: "v3", auth});
   calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 5,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, {data}) => {
    if (err) return console.log('The API returned an error: ' + err);
      for(let i = 0; i < 5; i++) {
        let eventTitle = data.items[i].summary;
        let eventDate = data.items[i].start.dateTime.substring(5, 10);
        let eventTime = data.items[i].start.dateTime.substring(11, 16);
        let eventData = {title: eventTitle, time: eventTime, date: eventDate};
        events.push(eventData);
      }
  });
 }

 function getCurrentDay(auth, data) {
   todayRow = data.todayRow;
   const service = google.sheets({version: "v4", auth});
   let range = "C" + todayRow + ":Z" + todayRow;
   service.spreadsheets.values.get({
     spreadsheetId: spreadsheetID,
     range: range
   }, (err, {data}) => {
     //console.log("Time elapsed:", new Date().getTime() - start_time);
     let values = data.values[0];
     currentDayValues = values;
   });
 }

 function changeHour(auth, data) {
   let todayRow = data.todayRow;
   let hourValue = data.hourValue;
   let hourIndex = data.hourIndex;
   const service = google.sheets({version: "v4", auth});
   let index = Number(hourIndex)+3;
   let range2 = alphabet[index] + todayRow;
   let backgroundColor = {};
   switch(hourValue) {
         case 1:
          backgroundColor = {
            "red": 0.6,
            "green": 0.6,
            "blue": 0.6
          }
          break;
        case 2:
          backgroundColor = {
            "red": 0.32549,
            "green": 0.03922,
            "blue": 0.4
          }
          break;
        case 3:
          backgroundColor = {
            "red": 1.0,
            "green": 0.6,
            "blue": 0.0
          }
          break;
        case 4:
          backgroundColor = {
            "red": 0.0,
            "green": 1.0,
            "blue": 0.0
          }
          hourValue = hourValue+2;
          break;
        case 5:
          backgroundColor = {
            "red": 0.0,
            "green": 0.0,
            "blue": 1.0
          }
          hourValue = hourValue+2;
          break;
        case 6:
          backgroundColor = {
            "red": 0.8,
            "green": 0.2549,
            "blue": 0.1451
          }
          hourValue = hourValue+2;
          break;
        case 7:
          backgroundColor = {
            "red": 0.470588,
            "green": 0.2470588,
            "blue": 0.015686
          }
          hourValue = hourValue+2;
          break;
        case 8:
          backgroundColor = {
            "red": 1.0,
            "green": 0.0,
            "blue": 1.0
          }
          hourValue = hourValue+2;
          break;
        case 9:
          backgroundColor = {
            "red": 0.0,
            "green": 0.0,
            "blue": 0.0
          }
          hourValue = hourValue+2;
          break;
        case 10:
          backgroundColor = {
            "red": 0.152941,
            "green": 0.30588,
            "blue": 0.0745098
          }
          hourValue = hourValue+2;
          break;
        case 11:
          backgroundColor = {
            "red": 0.9451,
            "green": 0.76078,
            "blue": 0.1961
          }
          hourValue = hourValue+2;
          break;
        case 12:
          backgroundColor = {
            "red": 0.49804,
            "green": 0.49804,
            "blue": 0.49804
          }
          hourValue = hourValue+2;
          break;
        default:
          backgroundColor = {
            "red": 1.0,
            "green": 1.0,
            "blue": 1.0
          }
       }
   service.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetID,
      resource: {
        requests: [{
             updateCells: {
               range: {
                 sheetId: 0,
                 startRowIndex: todayRow-1,
                 endRowIndex: todayRow,
                 startColumnIndex: index-1,
                 endColumnIndex: index
               },
               rows: [
                 {
                   values: {
                     userEnteredValue: {
                       numberValue: hourValue
                     },
                     userEnteredFormat: {
                       backgroundColor: {
                         red: backgroundColor.red,
                         green: backgroundColor.green,
                         blue: backgroundColor.blue
                       },
                       textFormat: {
                         fontFamily: "Verdana",
                         fontSize: 12,
                       }
                     }
                   }
                 }
               ],
               fields: "*"
             }
           }]
         }
   });
 }

app.use(express.static("public"));

app.get("/", function(req,res){
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket){
  function refresh() {
    authorize(userContent, listTaskLists);
    authorize(userContent, getEvents);
    authorize(userContent, getTodayRow, 1, 1, 2);
    setTimeout(function(){
      socket.emit("tasks", {data: tasks});
      socket.emit("getEvents", {data: events});
      socket.emit("getCurrentDay", {data: currentDayValues});
      socket.emit("getCurrentDate", {data: currentDateFormat})
    }, 100);
  }

  function changeDay(interval) {
    currentDate.setDate(currentDate.getDate() + interval);
    let dd1 = currentDate.getDate();
    let mm1 = currentDate.getMonth()+1;
    let yyyy1 = currentDate.getFullYear();
    if(dd1<10) {
      dd1 = "0"+dd1;
    }
    if(mm1<10) {
      mm1 = "0"+mm1;
    }
    currentDateFormat = yyyy1 + "/" +  mm1 + "/" + dd1;
    start_time = new Date().getTime();
    authorize(userContent, getTodayRow, 1, 1, 2);
    setTimeout(function(){
      socket.emit("getCurrentDay", {data: currentDayValues});
      socket.emit("getCurrentDate", {data: currentDateFormat})
    }, 2100)

  }

  refresh();

  socket.on("taskEdit", function(data) {
    let taskIndex = data.id;
    let taskData = data.data;
    authorize(userContent, changeTask, taskIndex, taskData);
  });

  socket.on("refresh", function(){
    refresh();
  })

  socket.on("addTask", function(data){
    authorize(userContent, addTask);
  });

  socket.on("removeTask", function(data){
    authorize(userContent, removeTask, data.id);
  });

  socket.on("changeHour", function(data){
    authorize(userContent, getTodayRow, data.value, data.index, 1);
  });

  socket.on("forwardDay", function(){
    if(today.getDate() > currentDate.getDate()) {
      changeDay(1);
   } else if(today.getMonth() > currentDate.getDate()) {
     changeDay(1);
   }
  });

  socket.on("backDay", function(){
    changeDay(-1);
  });

  socket.on("disconnect", function(){

  });
});

http.listen(3000, function(){
  console.log("Listening on localhost:3000");
});
