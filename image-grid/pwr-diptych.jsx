function createTwoImageMatteComp() {
    var win = new Window("palette", "Import 2 Images with Mattes", undefined);
    win.orientation = "column";
    win.alignChildren = "left";

    win.add("statictext", undefined, "Select Image 1:");
    var img1Group = win.add("group");
    var img1Input = img1Group.add("edittext", undefined, "", { readonly: true });
    img1Input.characters = 40;
    var browseImg1 = img1Group.add("button", undefined, "Browse");

    win.add("statictext", undefined, "Select Image 2:");
    var img2Group = win.add("group");
    var img2Input = img2Group.add("edittext", undefined, "", { readonly: true });
    var browseImg2 = img2Group.add("button", undefined, "Browse");

    win.add("statictext", undefined, "Comp Name:");
    var compNameInput = win.add("edittext", undefined, "Two Image Matte Comp");
    compNameInput.characters = 40;

    var goBtn = win.add("button", undefined, "Create Comp");

    var image1 = null;
    var image2 = null;

    browseImg1.onClick = function () {
        image1 = File.openDialog("Select first image", "*.*");
        if (image1) img1Input.text = image1.fsName;
    };

    browseImg2.onClick = function () {
        image2 = File.openDialog("Select second image", "*.*");
        if (image2) img2Input.text = image2.fsName;
    };

    goBtn.onClick = function () {
        if (!image1 || !image2) {
            alert("Please select both images.");
            return;
        }

        app.beginUndoGroup("Create 2 Image Matte Comp");

        var compWidth = 1440;
        var compHeight = 2560;
        var comp = app.project.items.addComp(compNameInput.text, compWidth, compHeight, 1, 20, 30);

        var matteWidth = 576;
        var matteHeight = 864;

        var startX = 144;
        var startY = 1296;

        var images = [image1, image2];

        for (var i = 0; i < 2; i++) {
            var importOpts = new ImportOptions(images[i]);
            var footage = app.project.importFile(importOpts);
            var layer = comp.layers.add(footage);

            // Scale proportionally to fit inside matte
            var scaleX = matteWidth / footage.width;
            var scaleY = matteHeight / footage.height;
            var scale = Math.min(scaleX, scaleY) * 100;
            layer.property("Scale").setValue([scale, scale]);

            // Position
            var x = startX + i * matteWidth;
            var y = startY;

            layer.property("Position").setValue([x + matteWidth / 2, y + matteHeight / 2]);

            // Matte
            var matte = comp.layers.addSolid([1, 1, 1], "Matte_" + (i+1), matteWidth, matteHeight, 1);
            matte.property("Position").setValue([x + matteWidth / 2, y + matteHeight / 2]);

            matte.moveBefore(layer);
            layer.trackMatteType = TrackMatteType.ALPHA;
        }

        app.endUndoGroup();
        win.close();
    };

    win.center();
    win.show();
}

createTwoImageMatteComp();
