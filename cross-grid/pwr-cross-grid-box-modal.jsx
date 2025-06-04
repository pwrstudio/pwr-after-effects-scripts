function crossGridWithUI() {
    // === Modal UI ===
    var win = new Window("palette", "Cross Grid Setup", undefined);
    win.orientation = "column";
    win.alignChildren = "left";
  
    win.add("statictext", undefined, "Enter Grid Corner Coordinates (X, Y):");
  
    function addCornerInput(label) {
      var group = win.add("group");
      group.add("statictext", undefined, label + " X:");
      var xInput = group.add("edittext", undefined, "0");
      xInput.characters = 5;
      group.add("statictext", undefined, "Y:");
      var yInput = group.add("edittext", undefined, "0");
      yInput.characters = 5;
      return { x: xInput, y: yInput };
    }
  
    var topLeft = addCornerInput("Top-Left");
    var topRight = addCornerInput("Top-Right");
    var bottomLeft = addCornerInput("Bottom-Left");
    var bottomRight = addCornerInput("Bottom-Right");
  
    var rectCheckbox = win.add("checkbox", undefined, "Add Rectangle Layer for Area");
  
    var goBtn = win.add("button", undefined, "Create Cross Grid");
  
    goBtn.onClick = function () {
      var comp = app.project.activeItem;
      if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
      }
  
      function parse(input) {
        return parseFloat(input.text) || 0;
      }
  
      var corners = [
        { x: parse(topLeft.x), y: parse(topLeft.y) },
        { x: parse(topRight.x), y: parse(topRight.y) },
        { x: parse(bottomLeft.x), y: parse(bottomLeft.y) },
        { x: parse(bottomRight.x), y: parse(bottomRight.y) },
      ];
  
      app.beginUndoGroup("Cross Grid with UI");
  
      var baseSize = 72;
      var shapeLayer = comp.layers.addShape();
      shapeLayer.name = "PWR Cross Grid " + Date.now().toString(36);
  
      var effects = shapeLayer.property("Effects");
  
      function addSlider(name, value) {
        var s = effects.addProperty("ADBE Slider Control");
        s.name = name;
        s.property("Slider").setValue(value);
      }
  
      function addAngle(name, value) {
        var a = effects.addProperty("ADBE Angle Control");
        a.name = name;
        a.property("Angle").setValue(value);
      }
  
      function addColor(name, r, g, b) {
        var c = effects.addProperty("ADBE Color Control");
        c.name = name;
        c.property("Color").setValue([r, g, b]);
      }
  
      addSlider("Horizontal Size (%)", 100);
      addSlider("Vertical Size (%)", 100);
      addSlider("Cross Thickness", 4);
      addSlider("Grid Zoom (%)", 100);
      addAngle("Cross Rotation", 0);
      addColor("Cross Color", 0.533, 0.533, 0.533);
  
      var renderList = corners;
  
      var contents = shapeLayer.property("Contents");
      var wrapperGroup = contents.addProperty("ADBE Vector Group");
      wrapperGroup.name = "Grid Wrapper";
  
      for (var i = 0; i < renderList.length; i++) {
        var pos = renderList[i];
  
        var group = wrapperGroup.property("Contents").addProperty("ADBE Vector Group");
        group.name = "Cross_" + i;
        var groupContents = group.property("Contents");
  
        var crossGroup = groupContents.addProperty("ADBE Vector Group");
        crossGroup.name = "Cross";
        var crossContents = crossGroup.property("Contents");
  
        var horiz = crossContents.addProperty("ADBE Vector Shape - Rect");
        horiz.name = "Horizontal";
        horiz.property("Size").expression =
          'sx = 72 * (effect("Horizontal Size (%)")("Slider") / 100);\n' +
          't = effect("Cross Thickness")("Slider");\n' +
          '[sx, t]';
  
        var vert = crossContents.addProperty("ADBE Vector Shape - Rect");
        vert.name = "Vertical";
        vert.property("Size").expression =
          'sy = 72 * (effect("Vertical Size (%)")("Slider") / 100);\n' +
          't = effect("Cross Thickness")("Slider");\n' +
          '[t, sy]';
  
        var fill = crossContents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").expression = 'effect("Cross Color")("Color")';
  
        crossGroup.property("Transform").property("Rotation").expression =
          'effect("Cross Rotation")("Angle")';
  
        // Convert to comp-space coordinates
        var xCoord = pos.x * baseSize;
        var yCoord = pos.y * baseSize;
        group.property("Transform").property("Position").setValue([xCoord, yCoord]);
      }
  
      shapeLayer.property("Transform").property("Position").setValue([
        comp.width / 2,
        comp.height / 2
      ]);
  
      // Align wrapper anchor point to first corner
      wrapperGroup.property("Transform").property("Anchor Point").setValue([
        corners[0].x * baseSize,
        corners[0].y * baseSize
      ]);
  
      wrapperGroup.property("Transform").property("Scale").expression =
        'zoom = effect("Grid Zoom (%)")("Slider"); [zoom, zoom];';
  
      // Rectangle area
      if (rectCheckbox.value) {
        var rectLayer = comp.layers.addShape();
        rectLayer.name = "Area Rectangle";
  
        var rectContents = rectLayer.property("Contents");
        var rectGroup = rectContents.addProperty("ADBE Vector Group");
        rectGroup.name = "Box";
  
        var shape = rectGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
  
        var x1 = Math.min(corners[0].x, corners[2].x) * baseSize;
        var x2 = Math.max(corners[1].x, corners[3].x) * baseSize;
        var y1 = Math.min(corners[0].y, corners[1].y) * baseSize;
        var y2 = Math.max(corners[2].y, corners[3].y) * baseSize;
  
        var width = x2 - x1;
        var height = y2 - y1;
  
        shape.property("Size").setValue([width, height]);
        shape.property("Position").setValue([0, 0]);
  
        var fill = rectGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue([0, 0, 0]);
  
        rectLayer.property("Transform").property("Position").setValue([x1 + width / 2, y1 + height / 2]);
      }
  
      app.endUndoGroup();
      win.close();
    };
  
    win.center();
    win.show();
  }
  
  crossGridWithUI();
  