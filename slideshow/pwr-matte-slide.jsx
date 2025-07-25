function swipeZoomTransitionUI() {
    var win = new Window("palette", "Swipe Zoom Sequence", undefined);
    win.orientation = "column";
    win.alignChildren = "left";
  
    win.add("statictext", undefined, "Choose Media Folder:");
    var folderGroup = win.add("group");
    var folderInput = folderGroup.add("edittext", undefined, "", { readonly: true });
    folderInput.characters = 40;
    var browseBtn = folderGroup.add("button", undefined, "Browse");
  
    win.add("statictext", undefined, "Comp Name:");
    var compNameInput = win.add("edittext", undefined, "SwipeZoomSequence");
    compNameInput.characters = 40;
  
    win.add("statictext", undefined, "Clip Duration (ms):");
    var durationInput = win.add("edittext", undefined, "2000");
  
    win.add("statictext", undefined, "Transition Duration (ms):");
    var transInput = win.add("edittext", undefined, "400");
  
    win.add("statictext", undefined, "Zoom Speed (pixels/sec):");
    var zoomInput = win.add("edittext", undefined, "100");
  
    var goBtn = win.add("button", undefined, "Create");
  
    var selectedFolder = null;
  
    browseBtn.onClick = function () {
      selectedFolder = Folder.selectDialog("Select media folder");
      if (selectedFolder) {
        folderInput.text = selectedFolder.fsName;
      }
    };
  
    goBtn.onClick = function () {
      var durationMs = parseInt(durationInput.text, 10);
      var transMs = parseInt(transInput.text, 10);
      var zoomSpeed = parseFloat(zoomInput.text);
  
      if (!selectedFolder || isNaN(durationMs) || isNaN(transMs) || isNaN(zoomSpeed)) {
        alert("Invalid input.");
        return;
      }
  
      var files = selectedFolder.getFiles(function (f) {
        return f instanceof File && f.name.match(/\.(jpg|jpeg|png|tif|tiff|mp4|mov|avi)$/i);
      });
  
      if (files.length < 1) {
        alert("No supported media files found.");
        return;
      }
  
      files.sort(function (a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
  
      app.beginUndoGroup("Swipe Zoom Sequence");
  
      var compWidth = 1440;
      var compHeight = 2560;
      var frameRate = 25;
      var clipDur = durationMs / 1000;
      var transDur = transMs / 1000;
      var stepDur = clipDur - transDur;
      var compDur = (files.length - 1) * stepDur + clipDur;
  
      var comp = app.project.items.addComp(compNameInput.text, compWidth, compHeight, 1, compDur, frameRate);
      var layerInfos = [];
  
      // Import and prepare all media layers and nulls
      for (var i = 0; i < files.length; i++) {
        var importOpts = new ImportOptions(files[i]);
        var footage = app.project.importFile(importOpts);
  
        var nullLayer = comp.layers.addNull();
        nullLayer.name = "ZoomControl_" + (i + 1);
        nullLayer.property("Position").setValue([compWidth / 2, compHeight / 2]);
  
        var mediaLayer = comp.layers.add(footage);
        mediaLayer.name = "Media_" + (i + 1);
        mediaLayer.parent = nullLayer;
  
        // Scale to cover comp
        var scaleX = compWidth / footage.width;
        var scaleY = compHeight / footage.height;
        var scale = Math.max(scaleX, scaleY) * 100;
        mediaLayer.property("Scale").setValue([scale, scale]);
        mediaLayer.property("Anchor Point").setValue([footage.width / 2, footage.height / 2]);
  
        // Align image so the top of the image aligns with the top of the comp
        var scaledHeight = footage.height * (scale / 100);
        var yOffset = (scaledHeight / 2) - (compHeight / 2);
        var yPos = compHeight / 2 - yOffset;
        mediaLayer.property("Position").setValue([compWidth / 2, yPos]);
  
        // Set timing
        var startTime = i * stepDur;
        var endTime = startTime + clipDur;
        nullLayer.startTime = mediaLayer.startTime = startTime;
        nullLayer.inPoint = mediaLayer.inPoint = startTime;
        nullLayer.outPoint = mediaLayer.outPoint = endTime;
  
        // Zoom animation
        var zoomAmount = zoomSpeed * clipDur;
        var dominantSize = Math.max(compWidth, compHeight);
        var zoomFactor = (dominantSize + zoomAmount) / dominantSize;
        var endScale = 100 * zoomFactor;
        var nullScale = nullLayer.property("Scale");
        nullScale.setValueAtTime(startTime, [100, 100]);
        nullScale.setValueAtTime(endTime, [endScale, endScale]);
  
        layerInfos.push({ media: mediaLayer, nullObj: nullLayer, start: startTime, end: endTime });
      }
  
      // Add matte transitions
      for (var j = 0; j < layerInfos.length - 1; j++) {
        var layerA = layerInfos[j].media;
        var layerB = layerInfos[j + 1].media;
  
        // Ensure correct stacking: lower media, then matte, then upper media
        layerB.moveToEnd(); // go to bottom
        layerA.moveToEnd(); // on top of that
  
        // Matte just above layerB, but below layerA
        var matte = comp.layers.addSolid([1, 1, 1], "Matte_" + (j + 1), compWidth, compHeight, 1);
        matte.moveBefore(layerA);
  
        var transStart = layerInfos[j + 1].start;
        var transEnd = transStart + transDur;
  
        matte.startTime = transStart;
        matte.inPoint = transStart;
        matte.outPoint = transEnd + 0.1;
  
        var pos = matte.property("Position");
        var startY = compHeight + compHeight / 2;
        var endY = compHeight / 2;
  
        pos.setValueAtTime(transStart, [compWidth / 2, startY]);
        pos.setValueAtTime(transEnd, [compWidth / 2, endY]);
  
        var ease = new KeyframeEase(0, 75);
        pos.setTemporalEaseAtKey(1, [ease], [ease]);
        pos.setTemporalEaseAtKey(2, [ease], [ease]);
  
        layerA.trackMatteType = TrackMatteType.ALPHA_INVERTED;
      }
  
      app.endUndoGroup();
      win.close();
    };
  
    win.center();
    win.show();
  }
  
  swipeZoomTransitionUI();
  