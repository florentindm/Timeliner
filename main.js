// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, dialog} = require('electron')
const fs = require('fs');
var screenshot = require('electron-screenshot-app');
const { exec } = require('child_process');
const path = require('path');
var Jimp = require('jimp');
var Timeliner = require('./timeliner.js')
var menuTemplate = require('./menu.js').getTemplate();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow(title) {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 3000,
    height: 3000,
    title: title
  })
  // mainWindow.loadFile('index.html');
  Timeliner.Set({
    mainWindow:mainWindow
  });

  // // and load the index.html of the app.
  // mainWindow.loadFile('index.html')

  // Open the DevTools.
  // var options = { frame: mainWindow } //specify your BrowserWindow options here, just an example
  // var viewport = require('electron-viewport')(width, height, options)
  // var mainWindow = viewport.getWindow()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  return mainWindow;
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
  console.log('App ready');
  console.log(app.getLocale());
  console.log(process.argv[1]);

  //Set menu
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  console.log('App activate');
  console.log(process.argv[1]);
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
})

app.commandLine.appendSwitch('lang', 'en_US')
exports.createWindow = createWindow;

