function importGridAssets() {
    var matteExtension = 2; // <--- Easily adjustable pixel extension value
  
    var win = new Window("palette", "Import Grid Assets", undefined);
    win.orientation = "column";
    win.alignChildren = "left";
  
    win.add("statictext", undefined, "Choose Asset Folder:");
    var folderGroup = win.add("group");
    var folderInput = folderGroup.add("edittext", undefined, "", { readonly: true });
    folderInput.characters = 40;
    var browseBtn = folderGroup.add("button", undefined, "Browse");
  
    win.add("statictext", undefined, "Comp Name:");
    var compNameInput = win.add("edittext", undefined, "Grid Comp");
    compNameInput.characters = 40;
  
    var goBtn = win.add("button", undefined, "Create Grid");
  
    var selectedFolder = null;
  
    browseBtn.onClick = function () {
      selectedFolder = Folder.selectDialog("Select folder with assets (images/videos)");
      if (selectedFolder) {
        folderInput.text = selectedFolder.fsName;
      }
    };
  
    goBtn.onClick = function () {
      if (!selectedFolder) {
        alert("Please select a folder.");
        return;
      }
  
      var files = selectedFolder.getFiles(function (f) {
        return (
          f instanceof File &&
          f.name.match(/\.(jpg|jpeg|png|tif|tiff|mov|mp4|avi|mpg|mpeg|m4v)$/i)
        );
      });
  
      if (files.length < 8) {
        alert("Please select a folder with at least 8 assets.");
        return;
      }
  
      // Randomly select 8 files
      files.sort(function () {
        return 0.5 - Math.random();
      });
      files = files.slice(0, 8);
  
      app.beginUndoGroup("Create 2x4 Grid Comp");
  
      var compWidth = 1440;
      var compHeight = 2560;
      var comp = app.project.items.addComp(compNameInput.text, compWidth, compHeight, 1, 20, 30);
  
      var cellSize = 576;
      var offsetX = 144;
      var offsetY = 144;
  
      var extendedCellSize = cellSize + matteExtension * 2;
  
      for (var i = 0; i < 8; i++) {
        var col = i % 2;
        var row = Math.floor(i / 2);
  
        var x = offsetX + col * cellSize;
        var y = offsetY + row * cellSize;
  
        var importOpts = new ImportOptions(files[i]);
        var footage = app.project.importFile(importOpts);
        var layer = comp.layers.add(footage);
  
        // Center asset in extended cell
        layer.property("Position").setValue([x + cellSize / 2, y + cellSize / 2]);
  
        // Scale to cover the extended area
        var scaleX = extendedCellSize / footage.width;
        var scaleY = extendedCellSize / footage.height;
        var scale = Math.max(scaleX, scaleY) * 100;
        layer.property("Scale").setValue([scale, scale]);
  
        // Create extended matte solid
        var matte = comp.layers.addSolid(
          [1, 1, 1],
          "Matte_" + i,
          extendedCellSize,
          extendedCellSize,
          1
        );
        matte.property("Position").setValue([x + cellSize / 2, y + cellSize / 2]);
  
        matte.moveBefore(layer);
        layer.trackMatteType = TrackMatteType.ALPHA;
      }
  
      app.endUndoGroup();
      win.close();
    };
  
    win.center();
    win.show();
  }
  
  importGridAssets();
  