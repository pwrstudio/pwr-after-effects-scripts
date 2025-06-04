function importSequentialImagesUI() {
    var win = new Window("palette", " " + "Import Image Sequence", undefined);
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
  
    win.add("statictext", undefined, "Zoom Speed (pixels/second):");
    var zoomSpeedInput = win.add("edittext", undefined, "100");
    zoomSpeedInput.characters = 20;
  
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
      var zoomSpeed = parseFloat(zoomSpeedInput.text);
  
      if (!selectedFolder || isNaN(durationMs) || isNaN(fadeMs) || isNaN(zoomSpeed)) {
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
  
      app.beginUndoGroup("Import Sequential Images with Null-Based Zoom");
  
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
  
        // Create null layer
        var nullLayer = comp.layers.addNull();
        nullLayer.name = "ZoomControl_" + (i + 1);
        nullLayer.moveToEnd();
        nullLayer.property("Position").setValue([compWidth / 2, compHeight / 2]);
  
        var layer = comp.layers.add(footage);
        layer.parent = nullLayer;
  
        var footageWidth = footage.width;
        var footageHeight = footage.height;
  
        // Scale image to cover comp
        var scaleX = compWidth / footageWidth;
        var scaleY = compHeight / footageHeight;
        var startScale = Math.max(scaleX, scaleY) * 100;
        layer.property("Scale").setValue([startScale, startScale]);
  
        // Anchor to center, position to top align in comp space
        layer.transform.anchorPoint.setValue([footageWidth / 2, footageHeight / 2]);
  
        var scaledHeight = footageHeight * (startScale / 100);
        var yOffset = (scaledHeight / 2) - (compHeight / 2);
        var posY = compHeight / 2 - yOffset;
        layer.property("Position").setValue([compWidth / 2, posY]);
  
        // Timing
        var startTime = i * durationSec;
        var endTime = (i + 1) * durationSec;
        layer.startTime = startTime;
        nullLayer.startTime = startTime;
        layer.outPoint = endTime;
        nullLayer.outPoint = endTime;
  
        // Fade out
        if (fadeMs > 0) {
          var opacity = layer.property("Opacity");
          opacity.setValueAtTime(startTime, 100);
          opacity.setValueAtTime(endTime - fadeSec, 100);
          opacity.setValueAtTime(endTime, 0);
        }
  
        // Animate null scale
        var nullScale = nullLayer.property("Scale");
        nullScale.setValueAtTime(startTime, [100, 100]);
  
        var zoomDuration = durationSec;
        var dominantCompSize = (scaleX > scaleY) ? compWidth : compHeight;
        var zoomAmountPx = zoomSpeed * zoomDuration;
        var zoomScaleFactor = (dominantCompSize + zoomAmountPx) / dominantCompSize;
        var endScale = 100 * zoomScaleFactor;
  
        nullScale.setValueAtTime(endTime, [endScale, endScale]);
      }
  
      app.endUndoGroup();
      win.close();
    };
  
    win.center();
    win.show();
  }
  
  importSequentialImagesUI();
  