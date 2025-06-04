function slideshowWithMatteUI() {
    var win = new Window("palette", "Matte Slideshow Setup", undefined);
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
  
    win.add("statictext", undefined, "Clip Duration (ms):");
    var durationInput = win.add("edittext", undefined, "2000");
    durationInput.characters = 20;
  
    win.add("statictext", undefined, "Fade Out Duration (ms):");
    var fadeInput = win.add("edittext", undefined, "250");
    fadeInput.characters = 20;
  
    win.add("statictext", undefined, "Pan Speed (px/sec):");
    var panSpeedInput = win.add("edittext", undefined, "20");
    panSpeedInput.characters = 20;
  
    win.add("statictext", undefined, "Matte Corner Coordinates (pixels):");
  
    function addCornerInput(label) {
      var group = win.add("group");
      group.add("statictext", undefined, label + " X:");
      var x = group.add("edittext", undefined, "0");
      x.characters = 6;
      group.add("statictext", undefined, "Y:");
      var y = group.add("edittext", undefined, "0");
      y.characters = 6;
      return { x: x, y: y };
    }
  
    var topLeft = addCornerInput("Top-Left");
    var topRight = addCornerInput("Top-Right");
    var bottomLeft = addCornerInput("Bottom-Left");
    var bottomRight = addCornerInput("Bottom-Right");
  
    var goBtn = win.add("button", undefined, "Create Slideshow");
    var selectedFolder = null;
  
    browseBtn.onClick = function () {
      selectedFolder = Folder.selectDialog("Select folder with images");
      if (selectedFolder) folderInput.text = selectedFolder.fsName;
    };
  
    goBtn.onClick = function () {
      function safeParse(field) {
        return field && field.text ? parseFloat(field.text) || 0 : 0;
      }
  
      var durationMs = parseInt(durationInput.text, 10);
      var fadeMs = parseInt(fadeInput.text, 10);
      var panSpeed = parseFloat(panSpeedInput.text);
  
      if (!selectedFolder || isNaN(durationMs) || isNaN(fadeMs) || isNaN(panSpeed)) {
        alert("Fill all fields and select a folder."); return;
      }
  
      var files = selectedFolder.getFiles(function (f) {
        return f instanceof File && f.name.match(/\.(jpg|jpeg|png|tif|tiff)$/i);
      });
  
      if (files.length === 0) {
        alert("No image files found."); return;
      }
  
      files.sort(function (a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
  
      app.beginUndoGroup("Matte Slideshow");
  
      var compWidth = 1440;
      var compHeight = 2560;
      var frameRate = 25;
      var compDuration = (files.length * durationMs) / 1000;
      var comp = app.project.items.addComp(compNameInput.text, compWidth, compHeight, 1, compDuration, frameRate);
  
      var matteX1 = safeParse(topLeft.x), matteY1 = safeParse(topLeft.y);
      var matteX2 = safeParse(topRight.x), matteY2 = safeParse(topRight.y);
      var matteX3 = safeParse(bottomLeft.x), matteY3 = safeParse(bottomLeft.y);
      var matteX4 = safeParse(bottomRight.x), matteY4 = safeParse(bottomRight.y);
  
      var matteWidth = Math.abs(matteX2 - matteX1);
      var matteHeight = Math.abs(matteY3 - matteY1);
      var matteCenter = [(matteX1 + matteX2) / 2, (matteY1 + matteY3) / 2];
      var durationSec = durationMs / 1000;
      var fadeSec = fadeMs / 1000;
  
      for (var i = 0; i < files.length; i++) {
        var footage = app.project.importFile(new ImportOptions(files[i]));
        var nullLayer = comp.layers.addNull();
        nullLayer.name = "PanControl_" + (i + 1);
        nullLayer.moveToEnd();
        nullLayer.property("Position").setValue([compWidth / 2, compHeight / 2]);
  
        var layer = comp.layers.add(footage);
        layer.parent = nullLayer;
  
        var scaleX = matteWidth / footage.width;
        var scaleY = matteHeight / footage.height;
        var scale = Math.max(scaleX, scaleY) * 100;
        layer.property("Scale").setValue([scale, scale]);
  
        layer.transform.anchorPoint.setValue([footage.width / 2, footage.height / 2]);
        layer.property("Position").setValue([matteCenter[0], matteCenter[1]]);
  
        var startTime = i * durationSec;
        var endTime = (i + 1) * durationSec;
  
        layer.startTime = startTime;
        layer.outPoint = endTime;
        nullLayer.startTime = startTime;
        nullLayer.outPoint = endTime;
  
        if (fadeMs > 0) {
          var opacity = layer.property("Opacity");
          opacity.setValueAtTime(startTime, 100);
          opacity.setValueAtTime(endTime - fadeSec, 100);
          opacity.setValueAtTime(endTime, 0);
        }
  
        var panDistance = panSpeed * durationSec;
        var startPos = [compWidth / 2, compHeight / 2];
        var endPos = [startPos[0] - panDistance, startPos[1]];
        var pos = nullLayer.property("Position");
        pos.setValueAtTime(startTime, startPos);
        pos.setValueAtTime(endTime, endPos);
      }
  
      // Add cross markers at corners
      var crossLayer = comp.layers.addShape();
      crossLayer.name = "Matte Cross Grid";
      var contents = crossLayer.property("Contents");
  
      var points = [
        [matteX1, matteY1],
        [matteX2, matteY2],
        [matteX3, matteY3],
        [matteX4, matteY4]
      ];
  
      for (var p = 0; p < points.length; p++) {
        var group = contents.addProperty("ADBE Vector Group");
        group.name = "Cross_" + (p + 1);
        var cross = group.property("Contents");
  
        var horiz = cross.addProperty("ADBE Vector Shape - Rect");
        horiz.name = "H";
        horiz.property("Size").setValue([40, 4]);
  
        var vert = cross.addProperty("ADBE Vector Shape - Rect");
        vert.name = "V";
        vert.property("Size").setValue([4, 40]);
  
        cross.addProperty("ADBE Vector Graphic - Fill").property("Color").setValue([0.6, 0.6, 0.6]);
  
        var t = group.property("Transform");
        t.property("Position").setValue(points[p]);
      }
  
      app.endUndoGroup();
      win.close();
    };
  
    win.center();
    win.show();
  }
  
  slideshowWithMatteUI();
  