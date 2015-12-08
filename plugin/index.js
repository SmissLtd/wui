// Imports
var self = require("sdk/self");
var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var panels = require("sdk/panel");
var prefs = require('sdk/simple-prefs');
var tabs = require("sdk/tabs");
var request = require("sdk/request").Request;

// State data
var isActive = false;
var UserName = "";
var ComputerName = prefs.prefs["ComputerName"];
var ServerURL = prefs.prefs["ServerURL"];
var logData = [];

// When computer name option is changed, update var
prefs.on("ComputerName", function() {
    ComputerName = prefs.prefs["ComputerName"];
});

// When server url option is changed, update var
prefs.on("ServerURL", function() {
    ServerURL = prefs.prefs["ServerURL"];
});

// Start/Stop button
var button = buttons.ActionButton({
    id: "wui-start-stop",
    label: "Start",
    icon: {
        "16": "./start-16.png",
        "32": "./start-32.png",
        "64": "./start-64.png"
    },
    onClick: handleClick
});

// "User name" dialog script
var dialogScript = "window.addEventListener('click', function(event) {" +
               "  var t = event.target;" +
               "  if (t.id == 'username')" +
               "    t.style.backgroundColor = 'white';" +
               "  else if (t.id == 'cancel')" +
               "    self.port.emit('dialog-cancel');" +
               "  else if (t.id == 'start')" +
               "  {" +
               "    var username = document.getElementById('username').value;" +
               "    if (username.length == 0)" +
               "      document.getElementById('username').style.backgroundColor = 'red';" +
               "    else" +
               "      self.port.emit('dialog-start', username);" +
               "  }" +
               "}, false);";

// "User name" dialog
var dialog = panels.Panel({
    contentURL: self.data.url("dialog.html"),
    contentScript: dialogScript,
    position: button,
    width: 400,
    height: 140
});

// "Computer name or server url" is empty error dialog
var computerDialog = panels.Panel({
    contentURL: self.data.url("computer.html"),
    position: button,
    width: 400,
    height: 70
});

// Experiment stoped dialog
var endDialog = panels.Panel({
    contentURL: self.data.url("end.html"),
    position: button,
    width: 400,
    height: 50
});

// Network error dialog
var errorDialog = panels.Panel({
    contentURL: self.data.url("error.html"),
    position: button,
    width: 400,
    height: 90
});

// When user click "Cancel" button on "User name" dialog, hide the dialog
dialog.port.on("dialog-cancel", function() {
    dialog.hide();
});

// When user click "OK" on "User name" dialog, start experiment
dialog.port.on("dialog-start", function(name) {
    UserName = name;
    dialog.hide();
    Start();
});

// Handle toolbar button clicks
function handleClick(state)
{
    endDialog.hide();
    if (isActive)
        Stop();
    else if (ComputerName == "" || ServerURL == "")
    {
        if (computerDialog.isShowing)
            computerDialog.hide();
        else
            computerDialog.show();
    }
    else if (dialog.isShowing)
        dialog.hide();
    else
        dialog.show();
}

// Start experiment
function Start()
{
    isActive = true;
    button.icon = {
        "16": "./stop-16.png",
        "32": "./stop-32.png",
        "64": "./stop-64.png"
    };
    button.label = "Stop";
    logData = [];
    for (var index = 0; index < tabs.length; index++)
        logData.push({
            id: tabs[index].id,
            url: tabs[index].url,
            start: (new Date()).getTime()
        });
}

// Process tab page load event
tabs.on("ready", function(tab) {
    if (!isActive)
        return;
    for (var index = 0; index < logData.length; index++)
        if (logData[index].id == tab.id)
        {
            if (logData[index].url == tab.url)
                return;
            SendData(logData[index].url, logData[index].start, (new Date()).getTime());
            logData[index].url = tab.url;
            logData[index].start = (new Date()).getTime();
            return;
        }
    logData.push({
        id: tab.id,
        url: tab.url,
        start: (new Date()).getTime()
    });
});

// Process tab close event
tabs.on("close", function(tab) {
    if (!isActive)
        return;
    for (var index = 0; index < logData.length; index++)
        if (logData[index].id == tab.id)
        {
            SendData(logData[index].url, logData[index].start, (new Date()).getTime());
            logData.splice(index, 1);
            return;
        }
});

// Stop experiment
function Stop()
{
    isActive = false;
    button.icon = {
        "16": "./start-16.png",
        "32": "./start-32.png",
        "64": "./start-64.png"
    };
    button.label = "Start";
    for (var index = 0; index < logData.length; index++)
        SendData(logData[index].url, logData[index].start, (new Date()).getTime());
    logData = [];
    endDialog.show();
}

// Send data to server(REST PUT)
function SendData(url, start, stop)
{
    start = (start * 0.001).toFixed(0);
    stop = (stop * 0.001).toFixed(0);
    request({
        url: ServerURL,
        content: {
            terminal: ComputerName,
            user: UserName,
            url: url,
            start: start,
            stop: stop,
            delay: stop - start
        },
        onComplete: function(response) {
            if (response.status != 200)
            {
                logData = [];
                isActive = false;
                button.icon = {
                    "16": "./start-16.png",
                    "32": "./start-32.png",
                    "64": "./start-64.png"
                };
                button.label = "Start";
                errorDialog.show();
            }
        }
    }).put();
}