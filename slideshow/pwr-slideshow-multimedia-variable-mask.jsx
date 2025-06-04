function importSequentialAssetsUI() {
    var win = new Window("palette", "Import Sequential Assets", undefined);
    win.orientation = "column";
    win.alignChildren = "left";

    win.add("statictext", undefined, "Choose Asset Folder:");
    var folderGroup = win.add("group");
    var folderInput = folderGroup.add("edittext", undefined, "", { readonly: true });
    folderInput.characters = 40;
    var browseBtn = folderGroup.add("button", undefined, "Browse");

    win.add("statictext", undefined, "Comp Name:");
    var compNameInput = win.add("edittext", undefined, "Asset Sequence");
    compNameInput.characters = 40;

    win.add("statictext", undefined, "Clip Duration (milliseconds):");
    var durationInput = win.add("edittext", undefined, "300");
    durationInput.characters = 20;

    win.add("statictext", undefined, "Fade Out Duration (milliseconds):");
    var fadeInput = win.add("edittext", undefined, "0");
    fadeInput.characters = 20;

    win.add("statictext", undefined, "Asset Width (pixels):");
    var assetWidthInput = win.add("edittext", undefined, "1000");
    assetWidthInput.characters = 10;

    win.add("statictext", undefined, "Mask Width (pixels):");
    var maskWidthInput = win.add("edittext", undefined, "720");
    maskWidthInput.characters = 10;

    win.add("statictext", undefined, "Mask Height (pixels):");
    var maskHeightInput = win.add("edittext", undefined, "720");
    maskHeightInput.characters = 10;

    win.add("statictext", undefined, "Offset X (pixels):");
    var offsetXInput = win.add("edittext", undefined, "0");
    offsetXInput.characters = 10;

    win.add("statictext", undefined, "Offset Y (pixels):");
    var offsetYInput = win.add("edittext", undefined, "0");
    offsetYInput.characters = 10;

    var goBtn = win.add("button", undefined, "Create Sequence");

    var selectedFolder = null;

    browseBtn.onClick = function () {
        selectedFolder = Folder.selectDialog("Select the folder with assets");
        if (selectedFolder) {
            folderInput.text = selectedFolder.fsName;
        }
    };

    goBtn.onClick = function () {
        var durationMs = parseInt(durationInput.text, 10);
        var fadeMs = parseInt(fadeInput.text, 10);
        var assetWidth = parseFloat(assetWidthInput.text);
        var maskWidth = parseFloat(maskWidthInput.text);
        var maskHeight = parseFloat(maskHeightInput.text);
        var offsetX = parseFloat(offsetXInput.text);
        var offsetY = parseFloat(offsetYInput.text);

        if (!selectedFolder || isNaN(durationMs) || isNaN(fadeMs)) {
            alert("Please select a folder and enter valid numbers.");
            return;
        }

        var files = selectedFolder.getFiles(function (f) {
            return f instanceof File && f.name.match(/\.(jpg|jpeg|png|tif|tiff|mp4|mov|avi|mkv|webm)$/i);
        });

        if (files.length === 0) {
            alert("No valid media files found in the selected folder.");
            return;
        }

        files.sort(function (a, b) {
            return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
        });

        app.beginUndoGroup("Import Sequential Assets");

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
            if (!importOpts.canImportAs(ImportAsType.FOOTAGE)) continue;
            importOpts.importAs = ImportAsType.FOOTAGE;

            var footage = app.project.importFile(importOpts);
            var layer = comp.layers.add(footage);

            var scaleFactor = assetWidth / footage.width;
            var newHeight = footage.height * scaleFactor;
            layer.property("Scale").setValue([scaleFactor * 100, scaleFactor * 100]);
            layer.property("Position").setValue([offsetX + assetWidth / 2, offsetY + newHeight / 2]);

            var matte = comp.layers.addSolid([1, 1, 1], "Matte_" + i, maskWidth, maskHeight, 1);
            matte.property("Position").setValue([offsetX + maskWidth / 2, offsetY + maskHeight / 2]);
            matte.moveBefore(layer);
            layer.trackMatteType = TrackMatteType.ALPHA;

            layer.startTime = i * durationSec;
            layer.outPoint = (i + 1) * durationSec;
            matte.startTime = layer.startTime;
            matte.outPoint = layer.outPoint;

            if (fadeMs > 0) {
                var opacity = layer.property("Opacity");
                opacity.setValueAtTime(layer.startTime, 100);
                opacity.setValueAtTime(layer.outPoint - fadeSec, 100);
                opacity.setValueAtTime(layer.outPoint, 0);

                var matteOpacity = matte.property("Opacity");
                matteOpacity.setValueAtTime(layer.startTime, 100);
                matteOpacity.setValueAtTime(layer.outPoint - fadeSec, 100);
                matteOpacity.setValueAtTime(layer.outPoint, 0);
            }
        }

        app.endUndoGroup();
        win.close();
    };

    win.center();
    win.show();
}

importSequentialAssetsUI();
