var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
  alert("Please select a composition.");
} else {
  app.beginUndoGroup("Dual Vertical Lines");

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
  shapeLayer.name = "PWR Dual Vertical Lines " + uniqueSuffix;

  var effects = shapeLayer.property("Effects");

  function addSlider(name, value) {
    var s = effects.addProperty("ADBE Slider Control");
    s.name = name;
    s.property("Slider").setValue(value);
  }

  function addColor(name, r, g, b) {
    var c = effects.addProperty("ADBE Color Control");
    c.name = name;
    c.property("Color").setValue([r, g, b]);
  }

  addSlider("Line Position", 0); // 0 = center, 100 = edges
  addSlider("Line Thickness", 5);
  addColor("Line Color", 1, 1, 1);

  var contents = shapeLayer.property("Contents");

  // === Left Line
  var leftLine = contents.addProperty("ADBE Vector Shape - Rect");
  leftLine.name = "Left Line";
  leftLine.property("Size").expression =
    't = effect("Line Thickness")("Slider");\n' +
    '[t, ' + comp.height + ']';

  // === Right Line
  var rightLine = contents.addProperty("ADBE Vector Shape - Rect");
  rightLine.name = "Right Line";
  rightLine.property("Size").expression =
    't = effect("Line Thickness")("Slider");\n' +
    '[t, ' + comp.height + ']';

  // === Fill for both lines
  var fill = contents.addProperty("ADBE Vector Graphic - Fill");
  fill.property("Color").expression = 'effect("Line Color")("Color")';

  // === Position expression for both lines
  var centerX = comp.width / 2;
  var centerY = comp.height / 2;
  var maxOffset = comp.width / 2;
  
  leftLine.property("Transform").property("Position").expression =
    'pos = effect("Line Position")("Slider") / 100;\n' +
    'offset = pos * ' + maxOffset + ';\n' +
    '[' + (centerX - maxOffset) + ' + offset, ' + centerY + ']';

  rightLine.property("Transform").property("Position").expression =
    'pos = effect("Line Position")("Slider") / 100;\n' +
    'offset = pos * ' + maxOffset + ';\n' +
    '[' + (centerX + maxOffset) + ' - offset, ' + centerY + ']';

  // Center the shape layer in the comp
  shapeLayer.property("Transform").property("Position").setValue([
    comp.width / 2,
    comp.height / 2
  ]);

  app.endUndoGroup();
} 