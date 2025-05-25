var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
  alert("Please select a composition.");
} else {
  app.beginUndoGroup("Grid of Crosses from Render List");

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

  // 🔧 Manually define crosses to render (grid positions)
  // var renderList = [
  //   { x: 2, y: 24 },
  //   { x: 18, y: 24 },
  //   { x: 2, y: 29 },
  //   { x: 18, y: 29 }
  // ];

  // var renderList = [
  //   { x: 2, y: 16 },
  //   { x: 18, y: 16 },
  //   { x: 2, y: 25 },
  //   { x: 18, y: 25 }
  // ];

  var renderList = [
    { x: 2, y: 18 },
    { x: 18, y: 18 },
    { x: 2, y: 30 },
    { x: 18, y: 30 }
  ];

  var contents = shapeLayer.property("Contents");

  // === Wrapper group for full grid
  var wrapperGroup = contents.addProperty("ADBE Vector Group");
  wrapperGroup.name = "Grid Wrapper";

  for (var i = 0; i < renderList.length; i++) {
    var pos = renderList[i];

    var group = wrapperGroup.property("Contents").addProperty("ADBE Vector Group");
    group.name = "Cross_" + i;
    var groupContents = group.property("Contents");

    // Subgroup to hold both rectangles
    var crossGroup = groupContents.addProperty("ADBE Vector Group");
    crossGroup.name = "Cross";
    var crossContents = crossGroup.property("Contents");

    // Horizontal rect
    var horiz = crossContents.addProperty("ADBE Vector Shape - Rect");
    horiz.name = "Horizontal";
    horiz.property("Size").expression =
      'sx = 72 * (effect("Horizontal Size (%)")("Slider") / 100);\n' +
      't = effect("Cross Thickness")("Slider");\n' +
      '[sx, t]';

    // Vertical rect
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

    // Position group at grid coordinate
    group.property("Transform").property("Position").setValue([
      pos.x * baseSize,
      pos.y * baseSize
    ]);
  }

  // Center the shape layer in the comp
  shapeLayer.property("Transform").property("Position").setValue([
    comp.width / 2,
    comp.height / 2
  ]);

  // Align wrapper around center point (2,4) by default
  var centerXIndex = 2;
  var centerYIndex = 4;
  var centerPosX = baseSize * centerXIndex;
  var centerPosY = baseSize * centerYIndex;

  wrapperGroup.property("Transform").property("Anchor Point").setValue([centerPosX, centerPosY]);
  wrapperGroup.property("Transform").property("Scale").expression =
    'zoom = effect("Grid Zoom (%)")("Slider"); [zoom, zoom];';

  app.endUndoGroup();
}
