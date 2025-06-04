function importSequentialImagesUI() {
  var win = new Window("palette", "Import Image Sequence", undefined);
  win.orientation = "column";
  win.alignChildren = "left";

  win.add("statictext", undefined, "Choose Image Folder:");
  var folderGroup = win.add("group");
  var folderInput = folderGroup.add("edittext", undefined, "", {readonly: true});
  folderInput.characters = 40;
  var browseBtn = folderGroup.add("button", undefined, "Browse");

  win.add("statictext", undefined, "Comp Name:");
  var compNameInput = win.add("edittext", undefined, "Image Sequence");
  compNameInput.characters = 40;

  win.add("statictext", undefined, "Clip Duration (milliseconds):");
  var durationInput = win.add("edittext", undefined, "300");
  durationInput.characters = 20;

  win.add("statictext", undefined, "Fade Out Duration (milliseconds):");
  var fadeInput = win.add("edittext", undefined, "0");
  fadeInput.characters = 20;

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

    if (!selectedFolder || isNaN(durationMs) || isNaN(fadeMs)) {
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

    // Sort files by filename (alphabetically/numerically)
    files.sort(function (a, b) {
      return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
    });

    app.beginUndoGroup("Import Sequential Images");

    var compName = compNameInput.text;
    var compWidth = 1440;
    var compHeight = 2560;
    var frameRate = 60;
    var durationSec = durationMs / 1000;
    var fadeSec = fadeMs / 1000;
    var compDuration = files.length * durationSec;

    var comp = app.project.items.addComp(compName, compWidth, compHeight, 1, compDuration, frameRate);

    for (var i = 0; i < files.length; i++) {
      var importOpts = new ImportOptions(files[i]);
      var footage = app.project.importFile(importOpts);
      var layer = comp.layers.add(footage);

      // Scale image proportionally to fit within 90% width or height
      var footageWidth = footage.width;
      var footageHeight = footage.height;

      var scaleX = (compWidth * 0.9) / footageWidth;
      var scaleY = (compHeight * 0.9) / footageHeight;
      var scale = Math.min(scaleX, scaleY) * 100;

      layer.property("Scale").setValue([scale, scale]);

      // Center layer
      layer.property("Position").setValue([compWidth / 2, compHeight / 2]);

      // Timing
      layer.startTime = i * durationSec;
      layer.outPoint = (i + 1) * durationSec;

      // Optional fade out
      if (fadeMs > 0) {
        var opacity = layer.property("Opacity");
        opacity.setValueAtTime(layer.startTime, 100);
        opacity.setValueAtTime(layer.outPoint - fadeSec, 100);
        opacity.setValueAtTime(layer.outPoint, 0);
      }
    }

    app.endUndoGroup();
    win.close();
  };

  win.center();
  win.show();
}

importSequentialImagesUI();