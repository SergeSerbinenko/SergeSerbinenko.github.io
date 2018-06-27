$(document).ready(function(){
  let socket = io();
  let upCurrentDay;
  let tasks;
  let runOnce = 0;
  let currentIndex = 0;
  let eventMTop = -3.3;
  let interval = -2.8;
  let runOncee = 0;
  let editable = true;
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

  let updateCurrentDay = function(upCurrentDay) {
    for (var i = 0; i < 24; i++) {
      if(upCurrentDay[i]) {
        if(upCurrentDay[i] > 3) {
          upCurrentDay[i] = Number(upCurrentDay[i]) - 2 + "";
        }
        let currentColor;
        switch(upCurrentDay[i]) {
          case "1":
            currentColor = "rgb(176, 176, 176)";
            $("#" + i).val("1");
            break;
          case "2":
            currentColor = "rgb(97, 80, 161)";
            $("#" + i).val("2");
            break;
          case "3":
            currentColor = "rgb(217, 154, 60)";
            $("#" + i).val("3");
            break;
          case "4":
            currentColor = "rgb(45, 217, 43)";
            $("#" + i).val("4");
            break;
          case "5":
            currentColor = "rgb(39, 106, 212)";
            $("#" + i).val("5");
            break;
          case "6":
            currentColor = "rgb(235, 73, 73)";
            $("#" + i).val("6");
            break;
          case "7":
            currentColor = "rgb(93, 66, 7)";
            $("#" + i).val("7");
            break;
          case "8":
            currentColor = "rgb(213, 30, 202)";
            $("#" + i).val("8");
            break;
          case "9":
            currentColor = "rgb(25, 35, 42)";
            $("#" + i).val("9");
            break;
          case "10":
            currentColor = "rgb(43, 91, 60)"
            $("#" + i).val("10");
            break;
          case "11":
            currentColor = "rgb(205, 204, 117)";
            $("#" + i).val("11");
            break;
          case "12":
            currentColor = "rgb(131, 130, 129)";
            $("#" + i).val("12");
            break;
          default:
            currentColor = "rgb(255, 255, 255)";
            $("#" + i).val("0");

        }

        $("#" + i).css("background-color", currentColor);
      } else {
        $("#" + i).css("background-color", "#ffffff");
      }

    }
  }

  $("body").on("mouseenter", "td", function(){
    let backgroundColor = $(this).css("background-color");
    let content;
    switch(backgroundColor) {
      case "rgb(176, 176, 176)":
        content = "Sleep";
        break;
      case "rgb(97, 80, 161)":
        content = "School";
        break;
      case "rgb(217, 154, 60)":
        content = "Downtime";
        break;
      case "rgb(45, 217, 43)":
        content = "Social Time";
        break;
      case "rgb(39, 106, 212)":
        content = "Excercise"
        break;
      case "rgb(235, 73, 73)":
        content = "Productive Time";
        break;
      case "rgb(93, 66, 7)":
        content = "Gaming";
        break;
      case "rgb(213, 30, 202)":
        content = "Family Time";
        break;
      case "rgb(25, 35, 42)":
        content = "Travel";
        break;
      case "rgb(43, 91, 60)":
        content = "Prep";
        break;
      case "rgb(205, 204, 117)":
        content = "Waste Time";
        break;
      case "rgb(131, 130, 129)":
        content = "Health";
        break;
      default:
        content = "";
    }
    if(content != "") {
      $(this).tooltipster({
        theme: "tooltipster-borderless",
        contentClothing: true,
        animation: "grow"
      }).tooltipster("content", content).tooltipster("open");
    } else {
      $(this).tooltipster("content", content).tooltipster("close");
    }
  });

  $("body").on("mouseleave", "td", function(){
    if($(this).css("background-color") != "rgb(255, 255, 255)") {
        $(this).tooltipster("close");
    }
  });

  $("body").on("click", ".removeTask", function(e){
    let index = $(this).closest("li").index() + 1;
    for(let i = index; i < $("#tasksList li").length; i++) {
      let newIndex = "t" + ($("#t" + i).attr("id").substring(1) - 1);
      $("#t" + i).attr("id", newIndex);
    }
    let data = {id: $(this).closest("li").children(".tasks").attr("id").substring(1)};
    $(this).closest("li").remove();
    currentIndex--;
    eventMTop = eventMTop - interval;
    $("#upcomingEvents").css("margin-top", eventMTop + "%");
    socket.emit("removeTask", data);
  });

  $("body").on("focus", ".tasks", function(e){
    $(this).val(this.placeholder);
  });

  $("body").on("focusout", ".tasks", function(e){
    let data = {id: $(this).attr("id").substring(1), data: $(this).val()}
    socket.emit("taskEdit", data);
    this.placeholder = $(this).val();
    $(this).val("");
  });

  $("body").on("keyup", ".tasks", function(e){
    if(e.keyCode == 8) {
      if($(this).val() == "") {
        this.placeholder = "";
      }
    } else if(e.keyCode == 13) {
      currentIndex++;
      eventMTop = eventMTop + interval;
      $("#upcomingEvents").css("margin-top", eventMTop + "%");
      $("#tasksList").append("<li><input class='tasks' placeholder='' id='t" + currentIndex + "'><button class='removeTask'>X</button></li>");
      $("#t" + currentIndex).focus();
      socket.emit("addTask");
    }
  });

  $("body").on("click", "#refresh", function(e){
    $("#refresh").addClass("animated flash").one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationed", function(){
      $("#refresh").removeClass("animated flash");
    });
    socket.emit("refresh");
  });

  $("body").on("click", "#backDay", function(e){
    $("#backDay").addClass("animated flash").one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationed", function(){
      $("#backDay").removeClass("animated flash");
    });
    socket.emit("backDay");
  });

  $("body").on("click", "#forwardDay", function(e){
    $("#forwardDay").addClass("animated flash").one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationed", function(){
      $("#forwardDay").removeClass("animated flash");
    });
    socket.emit("forwardDay");
  });

  $("body").on("click", "td", function(e){
      let currentColor = $(this).css("background-color");
      let tdId = $(this).attr('id');
      let hourValue;
      switch(currentColor) {
        case "rgb(176, 176, 176)":
          hourValue = 1;
          break;
        case "rgb(97, 80, 161)":
          hourValue = 2;
          break;
        case "rgb(217, 154, 60)":
          hourValue = 3;
          break;
        case "rgb(45, 217, 43)":
          hourValue = 4;
          break;
        case "rgb(39, 106, 212)":
          hourValue = 5;
          break;
        case "rgb(235, 73, 73)":
          hourValue = 6;
          break;
        case "rgb(93, 66, 7)":
          hourValue = 7;
          break;
        case "rgb(213, 30, 202)":
          hourValue = 8;
          break;
        case "rgb(25, 35, 42)":
          hourValue = 9;
          break;
        case "rgb(43, 91, 60)":
          hourValue = 10;
          break;
        case "rgb(205, 204, 117)":
          hourValue = 11;
          break;
        case "rgb(131, 130, 129)":
          hourValue = 12;
          break;
        default:
          hourValue = 0;
      }
      let data = {value: hourValue, index: tdId};
      socket.emit("changeHour", data);
  });

  socket.on("getCurrentDay", function(data){
    let values = data.data;
    updateCurrentDay(values);
  });

  socket.on("tasks", function(data){
    tasks = data.data
    if(tasks.length < $("#tasksList li").length) {
      eventMTop = eventMTop - interval;
      $("#upcomingEvents").css("margin-top", eventMTop + "%");
    }
    $("#tasksList").html("");
    if(runOncee == 0) {
      for(let i = 0; i < tasks.length; i++) {
        eventMTop = eventMTop + interval;
        $("#upcomingEvents").css("margin-top", eventMTop + "%");
        $("#tasksList").append("<li><input class='tasks' placeholder='" + tasks[i] + "' id='t" + i + "'><button class='removeTask'>X</button></li>");
        currentIndex = i;
        runOncee++;
      }
    } else {
      for(let i = 0; i < tasks.length; i++) {
        $("#tasksList").append("<li><input class='tasks' placeholder='" + tasks[i] + "' id='t" + i + "'><button class='removeTask'>X</button></li>");
        currentIndex = i;
      }
    }
  });

  socket.on("getEvents", function(data){
    events = data.data;
    $("#eventsList").html("");
    for(let i = 0; i < 5; i++) {
      $("#eventsList").append("<li><span class='eventTitle'>" + events[i].title + "</span><span class='eventDate'>" + events[i].time + " - " + events[i].date +"</span></li>");
    }
  });

  socket.on("getCurrentDate", function(data){
    let currentDate = data.data;
    $("#currentDayTitle").html("Current Day: " + currentDate);
  });

  socket.on("currentDay", function(data){
    upCurrentDay = data.data;
    updateCurrentDay(upCurrentDay);
  });

  let app = new Vue({
    el: "#mainContainer",
    data: {
      currentColor: "rgb(176, 176, 176)",
      colorValue: 0,
      currentDay: []
    },
    methods: {
      changeCat: function (color) {
        switch(color) {
          case 1:
            this.currentColor = "rgb(176, 176, 176)";
            this.colorValue = 1;
            break;
          case 2:
            this.currentColor = "rgb(97, 80, 161)";
            this.colorValue = 2;
            break;
          case 3:
            this.currentColor = "rgb(217, 154, 60)";
            this.colorValue = 3;
            break;
          case 4:
            this.currentColor = "rgb(45, 217, 43)";
            this.colorValue = 4;
            break;
          case 5:
            this.currentColor = "rgb(39, 106, 212)";
            this.colorValue = 5;
            break;
          case 6:
            this.currentColor = "rgb(235, 73, 73)";
            this.colorValue = 6;
            break;
          case 7:
            this.currentColor = "rgb(93, 66, 7)";
            this.colorValue = 7;
            break;
          case 8:
            this.currentColor = "rgb(213, 30, 202)";
            this.colorValue = 8;
            break;
          case 9:
            this.currentColor = "rgb(25, 35, 42)";
            this.colorValue = 9;
            break;
          case 10:
            this.currentColor = "rgb(43, 91, 60)"
            this.colorValue = 10;
            break;
          case 11:
            this.currentColor = "rgb(205, 204, 117)";
            this.colorValue = 11;
            break;
          case 12:
            this.currentColor = "rgb(131, 130, 129)";
            this.colorValue = 12;
            break;
        }
      },
      setHour: function (hour) {
        $("#" + hour).css("background-color", this.currentColor);
        $("#" + hour).val(this.colorValue);
        this.populateDay();
      },
      populateDay: function () {
        for(let i = 0; i < 23; i++) {
            this.currentDay[i] = $("#" + i).val();
        }
        let data = {type: "populateDay", data: this.currentDay};
        socket.emit("populateDay", data);
      }
    }
  })
});
