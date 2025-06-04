
var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
  alert("Please select a composition.");
} else {
  app.beginUndoGroup("Grid of Squares with Stroke and Offsets");

  var shapeLayer = comp.layers.addShape();
  shapeLayer.name = "Grid of Squares";

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

  addSlider("Square Size (%)", 100);
  addSlider("Stroke Thickness", 12);
  addSlider("Column Start Offset", 0);
  addSlider("Column End Offset", 0);
  addSlider("Row Start Offset", 0);
  addSlider("Row End Offset", 0);
  addAngle("Square Rotation", 0);
  addColor("Square Color", 1, 1, 1);

  var baseSize = 288;
  var columns = 5;
  var rows = 9;

  var contents = shapeLayer.property("Contents");

  // === Wrapper group for full grid
  var wrapperGroup = contents.addProperty("ADBE Vector Group");
  wrapperGroup.name = "Grid Wrapper";
  var wrapperContents = wrapperGroup.property("Contents");

  // === Square X group
  var xGroup = wrapperContents.addProperty("ADBE Vector Group");
  xGroup.name = "Square X";
  var xContents = xGroup.property("Contents");

  // Square
  var squareGroup = xContents.addProperty("ADBE Vector Group");
  squareGroup.name = "Square";
  var squareContents = squareGroup.property("Contents");

  var rectShape = squareContents.addProperty("ADBE Vector Shape - Rect");
  rectShape.name = "Square";
  rectShape.property("Size").expression =
    's = 288 * (effect("Square Size (%)")("Slider") / 100); [s, s]';

  var stroke = squareContents.addProperty("ADBE Vector Graphic - Stroke");
  stroke.property("Color").expression = 'effect("Square Color")("Color")';
  stroke.property("Stroke Width").expression = 'effect("Stroke Thickness")("Slider")';

  // Rotation
  squareGroup.property("Transform").property("Rotation").expression =
    'effect("Square Rotation")("Angle")';

  // Repeater X
  var xRepeater = xContents.addProperty("ADBE Vector Filter - Repeater");
  xRepeater.name = "X Repeat";
  xRepeater.property("Copies").expression =
    columns + ' - effect("Column Start Offset")("Slider") - effect("Column End Offset")("Slider")';
  xRepeater.property("Transform").property("Position").setValue([baseSize, 0]);

  // Apply column start offset
  xGroup.property("Transform").property("Position").expression =
    '[effect("Column Start Offset")("Slider") * ' + baseSize + ', 0]';

  // Repeater Y on wrapper
  var yRepeater = wrapperContents.addProperty("ADBE Vector Filter - Repeater");
  yRepeater.name = "Y Repeat";
  yRepeater.property("Copies").expression =
    rows + ' - effect("Row Start Offset")("Slider") - effect("Row End Offset")("Slider")';
  yRepeater.property("Transform").property("Position").setValue([0, baseSize]);

  // Apply row start offset to wrapper
  wrapperGroup.property("Transform").property("Position").expression =
    '[0, effect("Row Start Offset")("Slider") * ' + baseSize + ']';

  // Align top-left
  shapeLayer.property("Transform").property("Position").setValue([
    baseSize / 2,
    baseSize / 2
  ]);

  app.endUndoGroup();
}
