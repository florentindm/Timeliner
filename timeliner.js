const {app, BrowserWindow, Menu, dialog} = require('electron')
const fs = require('fs');
var screenshot = require('electron-screenshot-app');
const { exec } = require('child_process');
const path = require('path');
var Jimp = require('jimp');
const main = require('./main.js');

var mainWindow;
var file = {};
const frameFolder = path.join(__dirname,'frames');
const ressourcesFolder = path.join(__dirname,'src');

exports.Set = function(data){
	mainWindow = data.mainWindow
}

exports.getFile = function(){
	return file;
}

exports.newFile = function(){
	console.log('newFile');
}

exports.open = function(){
	dialog.showOpenDialog({filters:[{name:'Timeliner', extensions:['tmlnr']}]}, function(filepath){
      filepath = filepath[0]
      fs.readFile(filepath, 'utf8', function(err, filecontent) {
      	file = JSON.parse(filecontent);
      	file.name = path.basename(filepath);
      	main.createWindow(file.name);
      	loadAll();
      	console.log(file);
      });
	});
}

//Artboards
exports.linkHTML = function(){
	dialog.showOpenDialog(function(htmlfiles) {
	  file.artboard = htmlfiles[0];
	  loadArtboard();
	}); 
}

exports.linkSVG = function(){
  dialog.showOpenDialog(function(svgfiles) {
    var svgfile = svgfiles[0]
    fs.readFile(svgfile, 'utf8', function(err, svgcontent) {
      var htmlfile = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title></title></head><body>'+svgcontent+'</body></html>';
      var tmpSVGWrapped = "/tmp/index.html";
      file.artboard = tmpSVGWrapped
      fs.writeFile(file.artboard, htmlfile, function(err) {
          mainWindow.loadFile(tmpSVGWrapped)
      }); 
    });
    
  }); 
}

exports.refreshArtboard = function(){
	loadAll();
}

function loadAll(){
	loadArtboard();
	loadScripts();
}


//Timeline
exports.linkJS = function(){
  dialog.showOpenDialog(function (fileNames) {
  	console.log(fileNames)
    file.timeline = fileNames[0]
    loadScripts();
  }); 
}

exports.refreshTimeline = function(){
  loadScripts(function(){
    mainWindow.webContents.executeJavaScript('Timeliner.Play();')
  });
}

exports.save = function(){
	file = JSON.stringify(file);
	dialog.showSaveDialog(mainWindow,
		{
			filters: [{
		      name: 'Timeliner',
		      extensions: ['tmlnr']
		    }]
		}
		, function(destination){
		fs.writeFile(destination, file, function(err) {
		    if(err) {
		        return console.log(err);
		    }

		    console.log("The file was saved!");
		}); 
	})
}

exports.openInspector = function(){
	mainWindow.webContents.openDevTools()
}

function loadArtboard(){
	if(!mainWindow){
		mainWindow = main.createWindow(file.name);
	}
	mainWindow.loadFile(file.artboard);
}

function loadScripts(next){
  fs.readFile(path.join(ressourcesFolder, 'libs.js'), 'utf8', function(err, libs) {
    mainWindow.webContents.executeJavaScript(libs)
    fs.readFile(path.join(ressourcesFolder, 'loop.js'), 'utf8', function(err, loop) {
      mainWindow.webContents.executeJavaScript(loop)
      fs.readFile(file.timeline, 'utf8', function(err, timeline) {
        mainWindow.webContents.executeJavaScript(timeline)
        if(next)next();
      });
    });
  });
}

exports.exportFrame = function(filename, bounding, next){
  mainWindow.capturePage(function(img){
  	console.log('capturePage ' + filename)
    img = img.toPNG({
      scaleFactor:2.0
    });

    //Crop frame
    Jimp.read(img)
      .then(image => {
      	var trim = 4;
        var captureWidth = image.bitmap.width;
        var captureHeight = image.bitmap.height;
        var ratioWidth = captureWidth/bounding.clientWidth;
        var ratioHeight = captureHeight/bounding.clientHeight;
        

        //Crop infos
        var x = bounding.parentX*ratioWidth;
        var y = bounding.parentY*ratioHeight;
        var w = bounding.parentWidth*ratioWidth;
        var h = bounding.parentHeight*ratioHeight;


        //Trim
        x = x + trim;
        y = y + trim;
        w = w - trim;
        h = h - trim;

        //Round
        x = Math.ceil(x);
        y = Math.ceil(y);
        w = Math.ceil(w);
        h = Math.ceil(h);

        //Cropping
        console.log(x, y, w, h);
        image.crop(x, y, w, h);

        //Saving
        image.write(filename, function(){
          next();
        }); 
      })
      .catch(err => {
        console.log(err);
      });
    });
}

exports.exportVideo = function(){
  var destination = "exports/" + new Date().getTime() + ".mp4";
  var width = 1920;
  var fps = 30;
  var codec = "libx264";
  var exportCommand = "ffmpeg -r "+fps+" -f image2 -start_number 0001 -i "+frameFolder+"%04d.png -crf 18 -preset veryslow -c:v libx264 " + destination;
  console.log('ffmpeg export command: ' + exportCommand)
  exec(exportCommand, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }

    // Delete the original frames
    fs.readdir(frameFolder, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(frameFolder, file), err => {
          if (err) throw err;
        });
      }
    });

    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}

exports.test = function(){
  fs.readFile(path.join(__dirname, 'index.html'), 'utf8', function(err, test) {
    webLog(err);
    webLog(test);
    mainWindow.webContents.executeJavaScript(test)
  });
}

exports.executeFunction = function(fx){
	mainWindow.webContents.executeJavaScript(fx)
}

function webLog(msg){
	mainWindow.webContents.executeJavaScript('console.log('+msg+');');
}
