
var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
  alert("Please select a composition.");
} else {
  app.beginUndoGroup("Grid of Circles with Stroke and Offsets");

  var shapeLayer = comp.layers.addShape();
  shapeLayer.name = "Grid of Circles";

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

  addSlider("Circle Size (%)", 100);
  addSlider("Stroke Thickness", 12);
  addSlider("Column Start Offset", 0);
  addSlider("Column End Offset", 0);
  addSlider("Row Start Offset", 0);
  addSlider("Row End Offset", 0);
  addColor("Circle Color", 1, 1, 1);

  var baseSize = 288;
  var columns = 5;
  var rows = 9;

  var contents = shapeLayer.property("Contents");

  // === Wrapper group for full grid
  var wrapperGroup = contents.addProperty("ADBE Vector Group");
  wrapperGroup.name = "Grid Wrapper";
  var wrapperContents = wrapperGroup.property("Contents");

  // === Circle X group
  var xGroup = wrapperContents.addProperty("ADBE Vector Group");
  xGroup.name = "Circle X";
  var xContents = xGroup.property("Contents");

  // Circle
  var circleShape = xContents.addProperty("ADBE Vector Shape - Ellipse");
  circleShape.name = "Circle";
  circleShape.property("Size").expression =
    's = 288 * (effect("Circle Size (%)")("Slider") / 100); [s, s]';

  // Stroke instead of fill
  var stroke = xContents.addProperty("ADBE Vector Graphic - Stroke");
  stroke.property("Color").expression = 'effect("Circle Color")("Color")';
  stroke.property("Stroke Width").expression = 'effect("Stroke Thickness")("Slider")';

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
