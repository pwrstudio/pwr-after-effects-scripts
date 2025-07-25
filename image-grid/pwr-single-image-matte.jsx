function createSingleImageMatte() {
    var win = new Window("palette", "Single Image Matte Creator", undefined);
    win.orientation = "column";
    win.alignChildren = "left";
  
    win.add("statictext", undefined, "Choose Image File:");
    var fileGroup = win.add("group");
    var fileInput = fileGroup.add("edittext", undefined, "", { readonly: true });
    fileInput.characters = 40;
    var browseBtn = fileGroup.add("button", undefined, "Browse");
  
    win.add("statictext", undefined, "Comp Name:");
    var compNameInput = win.add("edittext", undefined, "Image Matte Comp");
    compNameInput.characters = 40;
  
    win.add("statictext", undefined, "Matte Size:");
    var sizeGroup = win.add("group");
    sizeGroup.add("statictext", undefined, "Width:");
    var widthInput = sizeGroup.add("edittext", undefined, "576");
    widthInput.characters = 8;
    sizeGroup.add("statictext", undefined, "Height:");
    var heightInput = sizeGroup.add("edittext", undefined, "576");
    heightInput.characters = 8;
  
    win.add("statictext", undefined, "Animation Duration (seconds):");
    var durationInput = win.add("edittext", undefined, "2");
    durationInput.characters = 8;
  
    var goBtn = win.add("button", undefined, "Create Matte");
  
    var selectedFile = null;
  
    browseBtn.onClick = function () {
      selectedFile = File.openDialog("Select image file", "*.jpg;*.jpeg;*.png;*.tif;*.tiff");
      if (selectedFile) {
        fileInput.text = selectedFile.fsName;
      }
    };
  
    goBtn.onClick = function () {
      if (!selectedFile) {
        alert("Please select an image file.");
        return;
      }
  
      var matteWidth = parseInt(widthInput.text) || 576;
      var matteHeight = parseInt(heightInput.text) || 576;
      var duration = parseFloat(durationInput.text) || 2;
  
      app.beginUndoGroup("Create Single Image Matte");
  
      var compWidth = matteWidth + 200; // Add some padding
      var compHeight = matteHeight + 200;
      var comp = app.project.items.addComp(compNameInput.text, compWidth, compHeight, 1, duration, 30);
  
      // Import the image
      var importOpts = new ImportOptions(selectedFile);
      var footage = app.project.importFile(importOpts);
      var imageLayer = comp.layers.add(footage);
  
      // Position image in center
      imageLayer.property("Position").setValue([compWidth / 2, compHeight / 2]);
  
      // Scale to cover matte bounds (center crop)
      var scaleX = matteWidth / footage.width;
      var scaleY = matteHeight / footage.height;
      var scale = Math.max(scaleX, scaleY) * 100;
      imageLayer.property("Scale").setValue([scale, scale]);
  
      // Create shape layer as matte
      var matte = comp.layers.addShape();
      matte.name = "Matte";
      var contents = matte.property("Contents");
      var rectGroup = contents.addProperty("ADBE Vector Group");
      rectGroup.name = "Rect Group";
      var rect = rectGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
      rect.property("Size").setValue([matteWidth, matteHeight]);
      rect.property("Position").setValue([0, 0]);
      var roundness = rect.property("Roundness");
      // Animate roundness from 0 to max (circle)
      var maxRadius = Math.min(matteWidth, matteHeight) / 2;
      roundness.setValueAtTime(0, 0);
      roundness.setValueAtTime(duration, maxRadius);
      // Add some easing for smooth animation
      var easeIn = new KeyframeEase(0.5, 33);
      var easeOut = new KeyframeEase(0.5, 33);
      roundness.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
      roundness.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
      // Add fill
      var fill = rectGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
      fill.property("Color").setValue([1,1,1]);
      // Center the shape layer
      matte.property("Transform").property("Position").setValue([compWidth/2, compHeight/2]);
      // Move matte above image layer
      matte.moveBefore(imageLayer);
      // Set up track matte: image uses matte as alpha
      imageLayer.trackMatteType = TrackMatteType.ALPHA;
  
      app.endUndoGroup();
      
      // Close the dialog
      win.close();
    };
  
    win.center();
    win.show();
  }
  
  createSingleImageMatte(); 