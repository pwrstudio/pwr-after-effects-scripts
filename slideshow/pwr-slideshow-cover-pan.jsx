function importSequentialImagesUI() {
    var win = new Window("palette", "Import Image Sequence", undefined);
    win.orientation = "column";
    win.alignChildren = "left";
  
    win.add("statictext", undefined, "Choose Image Folder:");
    var folderGroup = win.add("group");
    var folderInput = folderGroup.add("edittext", undefined, "", { readonly: true });
    folderInput.characters = 40;
    var browseBtn = folderGroup.add("button", undefined, "Browse");
  
    win.add("statictext", undefined, "Comp Name:");
    var compNameInput = win.add("edittext", undefined, "Image Sequence");
    compNameInput.characters = 40;
  
    win.add("statictext", undefined, "Clip Duration (milliseconds):");
    var durationInput = win.add("edittext", undefined, "2000");
    durationInput.characters = 20;
  
    win.add("statictext", undefined, "Fade Out Duration (milliseconds):");
    var fadeInput = win.add("edittext", undefined, "250");
    fadeInput.characters = 20;
  
    win.add("statictext", undefined, "Pan Speed (pixels/sec):");
    var panSpeedInput = win.add("edittext", undefined, "20");
    panSpeedInput.characters = 20;
  
    var goBtn = win.add("button", undefined, "Create Sequence");
  
    var selectedFolder = null;
  
    browseBtn.onClick = function () {
      selectedFolder = Folder.selectDialog("Select the folder with images");
      if (selectedFolder) {
        folderInput.text = selectedFolder.fsName;
      }
    };
  
    goBtn.onClick = function () {
      var durationMs = parseInt(durationInput.text, 10);
      var fadeMs = parseInt(fadeInput.text, 10);
      var panSpeed = parseFloat(panSpeedInput.text);
  
      if (!selectedFolder || isNaN(durationMs) || isNaN(fadeMs) || isNaN(panSpeed)) {
        alert("Please select a folder and enter valid numbers.");
        return;
      }
  
      var files = selectedFolder.getFiles(function (f) {
        return f instanceof File && f.name.match(/\.(jpg|jpeg|png|tif|tiff)$/i);
      });
  
      if (files.length === 0) {
        alert("No image files found in the selected folder.");
        return;
      }
  
      files.sort(function (a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
  
      app.beginUndoGroup("Import Sequential Images with Top-Aligned Pan");
  
      var compName = compNameInput.text;
      var compWidth = 1440;
      var compHeight = 2560;
      var frameRate = 25;
      var durationSec = durationMs / 1000;
      var fadeSec = fadeMs / 1000;
      var compDuration = files.length * durationSec;
  
      var comp = app.project.items.addComp(compName, compWidth, compHeight, 1, compDuration, frameRate);
  
      for (var i = 0; i < files.length; i++) {
        var importOpts = new ImportOptions(files[i]);
        var footage = app.project.importFile(importOpts);
  
        // Create null for pan control
        var nullLayer = comp.layers.addNull();
        nullLayer.name = "PanControl_" + (i + 1);
        nullLayer.moveToEnd();
        nullLayer.property("Position").setValue([compWidth / 2, compHeight / 2]);
  
        var layer = comp.layers.add(footage);
        layer.parent = nullLayer;
  
        var footageWidth = footage.width;
        var footageHeight = footage.height;
  
        // Scale image to cover comp
        var scaleX = compWidth / footageWidth;
        var scaleY = compHeight / footageHeight;
        var scale = Math.max(scaleX, scaleY) * 100;
        layer.property("Scale").setValue([scale, scale]);
  
        // Set anchor to center
        layer.transform.anchorPoint.setValue([footageWidth / 2, footageHeight / 2]);
  
        // Align top of image with top of comp
        layer.property("Position").setValue([compWidth / 2, 0]);
  
        // Timing
        layer.startTime = i * durationSec;
        nullLayer.startTime = i * durationSec;
  
        layer.outPoint = (i + 1) * durationSec;
        nullLayer.outPoint = (i + 1) * durationSec;
  
        // Fade out
        if (fadeMs > 0) {
          var opacity = layer.property("Opacity");
          opacity.setValueAtTime(layer.startTime, 100);
          opacity.setValueAtTime(layer.outPoint - fadeSec, 100);
          opacity.setValueAtTime(layer.outPoint, 0);
        }
  
        // Animate null to pan left
        var startPos = [compWidth / 2, compHeight / 2];
        var endPos = [startPos[0] - (panSpeed * durationSec), startPos[1]];
        var posProp = nullLayer.property("Position");
        posProp.setValueAtTime(layer.startTime, startPos);
        posProp.setValueAtTime(layer.outPoint, endPos);
      }
  
      app.endUndoGroup();
      win.close();
    };
  
    win.center();
    win.show();
  }
  
  importSequentialImagesUI();
  