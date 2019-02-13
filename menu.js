var Timeliner = require('./timeliner.js');

var template = [
  {
  label: "Application",
  submenu: [
      { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
  ]},
  {
  label: "File",
  submenu: [
      { label: "New", accelerator: "CmdOrCtrl+N", click:Timeliner.newFile},
      { label: "Open", accelerator: "CmdOrCtrl+O", click:Timeliner.open},
      { label: "Save", accelerator: "CmdOrCtrl+S", click:Timeliner.save},
      { label: "Save As", accelerator: "Shift+CmdOrCtrl+S"},
      { label: "Close", accelerator: "CmdOrCtrl+W"},
      { label: "Test", click:Timeliner.test},
  ]},
  {
  label: "Edit",
  submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
  ]},
  {
    label:'Artboard',
    submenu:[
      {label:'Import', click:Timeliner.linkHTML},
      {type: "separator"},
      {label:'Inspector', accelerator: "Alt+CmdOrCtrl+I", click:Timeliner.openInspector},
      {type: "separator"},
      {label:'Refresh',click:Timeliner.refreshArtboard}
    ]
  },
  {
    label:'Timeline',
    submenu:[
      {label:'Import', click:Timeliner.linkJS},
      {type: "separator" },
      {label:'Edit'},
      {type: "separator" },
      {label:'Refresh', accelerator: 'CommandOrControl+R', click:Timeliner.refreshTimeline}
    ]
  },
  {
    label:'Animation',
    submenu:[
      {
        label:'Play',
        click:function(){
          Timeliner.executeFunction('Timeliner.Play();');
        }
      },
      {
        label:'Next frame',
        accelerator: 'Right',
        click:function(){
          Timeliner.executeFunction('Timeliner.nextFrame();');
        }
      },
      {
        label:'Previous frame',
        accelerator: 'Left',
        click:function(){
          Timeliner.executeFunction('Timeliner.previousFrame();');
        }
      },
      { type: "separator" },
      {
        label:'Export',
        click:function(){
          Timeliner.executeFunction('Timeliner.Export();');
        }
      }
    ]
  }
]

exports.getTemplate = function(){
  return template;
}