function showCrossGridModal() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      alert("Please select a composition.");
      return;
    }
  
    var win = new Window("palette", "Cross Grid Area", undefined);
    win.orientation = "column";
    win.alignChildren = "left";
  
    function labeledField(label, defaultValue) {
      win.add("statictext", undefined, label);
      var field = win.add("edittext", undefined, defaultValue);
      field.characters = 10;
      return field;
    }
  
    var widthInput = labeledField("Matte Width (units of 72px):", "4");
    var heightInput = labeledField("Matte Height (units of 72px):", "4");
    var leftInput = labeledField("Left Offset (units of 72px):", "2");
    var topInput = labeledField("Top Offset (units of 72px):", "23");
  
    var goBtn = win.add("button", undefined, "Create Cross Grid");
  
    goBtn.onClick = function () {
      var matteW = parseInt(widthInput.text) || 4;
      var matteH = parseInt(heightInput.text) || 4;
      var left = parseInt(leftInput.text) || 2;
      var top = parseInt(topInput.text) || 2;
  
      win.close();
      createCrossGrid(comp, left, top, matteW, matteH);
    };
  
    win.center();
    win.show();
  }
  
  function createCrossGrid(comp, left, top, width, height) {
    app.beginUndoGroup("Create Cross Grid");
  
    function generateRandomString(length) {
      var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
      var result = "";
      for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  
    var uniqueSuffix = generateRandomString(6);
    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = "PWR Cross Grid " + uniqueSuffix;
  
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
    addSlider("Cross Thickness", 5);
    addSlider("Grid Zoom (%)", 100);
    addAngle("Cross Rotation", 0);
    addColor("Cross Color", 1, 1, 1);
  
    var baseSize = 72;
  
    // 🔧 Auto-generate renderList from input
    var renderList = [
      { x: left, y: top },
      { x: left + width, y: top },
      { x: left, y: top + height },
      { x: left + width, y: top + height }
    ];
  
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
  
      group.property("Transform").property("Position").setValue([
        pos.x * baseSize,
        pos.y * baseSize
      ]);
    }
  
    shapeLayer.property("Transform").property("Position").setValue([
      comp.width / 2,
      comp.height / 2
    ]);
  
    var centerX = (left + width / 2) * baseSize;
    var centerY = (top + height / 2) * baseSize;
  
    wrapperGroup.property("Transform").property("Anchor Point").setValue([centerX, centerY]);
    wrapperGroup.property("Transform").property("Scale").expression =
      'zoom = effect("Grid Zoom (%)")("Slider"); [zoom, zoom];';
  
    app.endUndoGroup();
  }
  
  showCrossGridModal();
  