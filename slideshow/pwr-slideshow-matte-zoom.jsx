function importSequentialImagesWithSharedMatteUI() {
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

  win.add("statictext", undefined, "Clip Duration (ms):");
  var durationInput = win.add("edittext", undefined, "2000");

  win.add("statictext", undefined, "Fade Out Duration (ms):");
  var fadeInput = win.add("edittext", undefined, "250");

  win.add("statictext", undefined, "Zoom Speed (px/sec):");
  var zoomSpeedInput = win.add("edittext", undefined, "100");

  win.add("statictext", undefined, "Matte Width (units of 72px):");
  var matteWidthInput = win.add("edittext", undefined, "4");

  win.add("statictext", undefined, "Matte Height (units of 72px):");
  var matteHeightInput = win.add("edittext", undefined, "4");

  win.add("statictext", undefined, "Matte Left Offset (units of 72px):");
  var matteLeftInput = win.add("edittext", undefined, "1");

  win.add("statictext", undefined, "Matte Top Offset (units of 72px):");
  var matteTopInput = win.add("edittext", undefined, "1");

  var goBtn = win.add("button", undefined, "Create Sequence");

  var selectedFolder = null;

  browseBtn.onClick = function () {
    selectedFolder = Folder.selectDialog("Select folder with images");
    if (selectedFolder) {
      folderInput.text = selectedFolder.fsName;
    }
  };

  goBtn.onClick = function () {
    var durationMs = parseInt(durationInput.text);
    var fadeMs = parseInt(fadeInput.text);
    var zoomSpeed = parseFloat(zoomSpeedInput.text);

    var matteW = parseFloat(matteWidthInput.text) * 72;
    var matteH = parseFloat(matteHeightInput.text) * 72;
    var matteLeft = parseFloat(matteLeftInput.text) * 72;
    var matteTop = parseFloat(matteTopInput.text) * 72;

    if (!selectedFolder || isNaN(durationMs) || isNaN(fadeMs) || isNaN(zoomSpeed)) {
      alert("Please enter valid inputs.");
      return;
    }

    var files = selectedFolder.getFiles(function (f) {
      return f instanceof File && f.name.match(/\.(jpg|jpeg|png|tif|tiff)$/i);
    });

    if (files.length === 0) {
      alert("No image files found.");
      return;
    }

    files.sort(function (a, b) {
      return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
    });

    app.beginUndoGroup("Import Images with Matte Crop");

    var compWidth = 1440;
    var compHeight = 2560;
    var frameRate = 25;
    var durationSec = durationMs / 1000;
    var fadeSec = fadeMs / 1000;
    var compDuration = files.length * durationSec;

    var comp = app.project.items.addComp(
      compNameInput.text,
      compWidth,
      compHeight,
      1,
      compDuration,
      frameRate
    );

    var matteCenter = [matteLeft + matteW / 2, matteTop + matteH / 2];

    for (var i = 0; i < files.length; i++) {
      var importOpts = new ImportOptions(files[i]);
      var footage = app.project.importFile(importOpts);
      var layer = comp.layers.add(footage);

      // Scale proportionally to fit matte
      var scaleX = matteW / footage.width;
      var scaleY = matteH / footage.height;
      var fitScale = Math.min(scaleX, scaleY) * 100;
      layer.property("Scale").setValue([fitScale, fitScale]);

      // Position centered in matte
      layer.transform.anchorPoint.setValue([footage.width / 2, footage.height / 2]);
      layer.property("Position").setValue(matteCenter);

      // Add null for zooming
      var zoomNull = comp.layers.addNull();
      zoomNull.name = "Zoom_" + (i + 1);
      zoomNull.property("Position").setValue(matteCenter);
      layer.parent = zoomNull;

      // Matte solid (duplicate for each layer due to AE matte limitations)
      var matte = comp.layers.addSolid([1, 1, 1], "Matte_" + (i + 1), matteW, matteH, 1);
      matte.property("Position").setValue(matteCenter);
      matte.moveBefore(layer);
      layer.trackMatteType = TrackMatteType.ALPHA;

      // Timing
      var start = i * durationSec;
      var end = (i + 1) * durationSec;

      layer.startTime = start;
      matte.startTime = start;
      zoomNull.startTime = start;

      layer.outPoint = end;
      matte.outPoint = end;
      zoomNull.outPoint = end;

      // Fade out
      if (fadeMs > 0) {
        var opacity = layer.property("Opacity");
        opacity.setValueAtTime(start, 100);
        opacity.setValueAtTime(end - fadeSec, 100);
        opacity.setValueAtTime(end, 0);

        var matteOpacity = matte.property("Opacity");
        matteOpacity.setValueAtTime(start, 100);
        matteOpacity.setValueAtTime(end - fadeSec, 100);
        matteOpacity.setValueAtTime(end, 0);
      }

      // Zoom
      var nullScale = zoomNull.property("Scale");
      nullScale.setValueAtTime(start, [100, 100]);

      var dominantSize = Math.max(matteW, matteH);
      var zoomAmount = zoomSpeed * durationSec;
      var endScale = 100 * ((dominantSize + zoomAmount) / dominantSize);

      nullScale.setValueAtTime(end, [endScale, endScale]);
    }

    app.endUndoGroup();
    win.close();
  };

  win.center();
  win.show();
}

importSequentialImagesWithSharedMatteUI();
