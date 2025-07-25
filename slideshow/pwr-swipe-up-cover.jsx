function swipeImageSequenceUI() {
    var win = new Window("palette", "Vertical Swipe Slideshow", undefined);
    win.orientation = "column";
    win.alignChildren = "left";
  
    win.add("statictext", undefined, "Choose Image Folder:");
    var folderGroup = win.add("group");
    var folderInput = folderGroup.add("edittext", undefined, "", { readonly: true });
    folderInput.characters = 40;
    var browseBtn = folderGroup.add("button", undefined, "Browse");
  
    win.add("statictext", undefined, "Comp Name:");
    var compNameInput = win.add("edittext", undefined, "Swipe Slideshow");
    compNameInput.characters = 40;
  
    win.add("statictext", undefined, "Image Duration (ms):");
    var durationInput = win.add("edittext", undefined, "2000");
    durationInput.characters = 20;
  
    win.add("statictext", undefined, "Transition Duration (ms):");
    var transitionInput = win.add("edittext", undefined, "200");
    transitionInput.characters = 20;
  
    var goBtn = win.add("button", undefined, "Create Slideshow");
  
    var selectedFolder = null;
  
    browseBtn.onClick = function () {
      selectedFolder = Folder.selectDialog("Select the folder with images");
      if (selectedFolder) {
        folderInput.text = selectedFolder.fsName;
      }
    };
  
    goBtn.onClick = function () {
      var durationMs = parseInt(durationInput.text, 10);
      var transMs = parseInt(transitionInput.text, 10);
  
      if (!selectedFolder || isNaN(durationMs) || isNaN(transMs)) {
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
  
      app.beginUndoGroup("Create Swipe Slideshow");
  
      var compWidth = 1440;
      var compHeight = 2560;
      var frameRate = 30;
      var imgDuration = durationMs / 1000;
      var transDuration = transMs / 1000;
      var stepTime = imgDuration - transDuration;
      var compDuration = stepTime * (files.length - 1) + imgDuration;
  
      var comp = app.project.items.addComp(compNameInput.text, compWidth, compHeight, 1, compDuration, frameRate);
  
      var layers = [];
  
      for (var i = 0; i < files.length; i++) {
        var importOpts = new ImportOptions(files[i]);
        var footage = app.project.importFile(importOpts);
        var layer = comp.layers.add(footage);
        layers.push(layer);
  
        // Scale and center
        var scaleX = compWidth / footage.width;
        var scaleY = compHeight / footage.height;
        var scale = Math.max(scaleX, scaleY) * 100;
        layer.property("Scale").setValue([scale, scale]);
        layer.transform.anchorPoint.setValue([footage.width / 2, footage.height / 2]);
      }
  
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var startTime = i * stepTime;
  
        var onScreen = [compWidth / 2, compHeight / 2];
        var offAbove = [compWidth / 2, -compHeight / 2];
        var offBelow = [compWidth / 2, compHeight * 1.5];
  
        var pos = layer.property("Position");
  
        if (i === 0) {
          // First image stays still, swipes out later
          pos.setValueAtTime(startTime, onScreen);
          pos.setValueAtTime(startTime + stepTime, onScreen);
          pos.setValueAtTime(startTime + stepTime + transDuration, offAbove);
          pos.setTemporalEaseAtKey(2, [new KeyframeEase(0, 75)], [new KeyframeEase(0, 75)]);
        } else {
          // Incoming image: swipe in from below
          var inStart = startTime;
          var inEnd = inStart + transDuration;
  
          pos.setValueAtTime(inStart, offBelow);
          pos.setValueAtTime(inEnd, onScreen);
  
          pos.setTemporalEaseAtKey(1, [new KeyframeEase(0, 75)], [new KeyframeEase(0, 75)]);
          pos.setTemporalEaseAtKey(2, [new KeyframeEase(0, 75)], [new KeyframeEase(0, 75)]);
  
          // Previous image: swipe out to top at the same time
          var prevLayer = layers[i - 1];
          var prevPos = prevLayer.property("Position");
  
          prevPos.setValueAtTime(inStart, onScreen);
          prevPos.setValueAtTime(inEnd, offAbove);
  
          prevPos.setTemporalEaseAtKey(prevPos.numKeys - 1, [new KeyframeEase(0, 75)], [new KeyframeEase(0, 75)]);
        }
  
        layer.startTime = startTime;
        layer.inPoint = startTime;
        layer.outPoint = startTime + imgDuration + 0.1;
      }
  
      app.endUndoGroup();
      win.close();
    };
  
    win.center();
    win.show();
  }
  
  swipeImageSequenceUI();
  