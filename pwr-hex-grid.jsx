
var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
  alert("Please select a composition.");
} else {
  app.beginUndoGroup("Stable Grid of Hexagons with Stroke and Offsets");

  var shapeLayer = comp.layers.addShape();
  shapeLayer.name = "Grid of Hexagons";

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

  addSlider("Hexagon Size (%)", 100);
  addSlider("Stroke Thickness", 12);
  addSlider("Column Start Offset", 0);
  addSlider("Column End Offset", 0);
  addSlider("Row Start Offset", 0);
  addSlider("Row End Offset", 0);
  addAngle("Hexagon Rotation", 0);
  addColor("Hexagon Color", 1, 1, 1);

  var baseSize = 288;
  var columns = 5;
  var rows = 9;

  var contents = shapeLayer.property("Contents");

  // === Wrapper group for full grid
  var wrapperGroup = contents.addProperty("ADBE Vector Group");
  wrapperGroup.name = "Grid Wrapper";
  var wrapperContents = wrapperGroup.property("Contents");

  // === Hexagon X group
  var xGroup = wrapperContents.addProperty("ADBE Vector Group");
  xGroup.name = "Hexagon X";
  var xContents = xGroup.property("Contents");

  // Hexagon group
  var hexGroup = xContents.addProperty("ADBE Vector Group");
  hexGroup.name = "Hexagon";
  var hexContents = hexGroup.property("Contents");

  // Polygon shape (6 sides)
  var hexagon = hexContents.addProperty("ADBE Vector Shape - Polygon");
  hexagon.property("Points").setValue(6);
  hexagon.property("Outer Radius").setValue(144); // safe default
  hexagon.property("Outer Radius").expression =
    '144 * (effect("Hexagon Size (%)")("Slider") / 100)';
  hexagon.property("Rotation").setValue(0);

  // Stroke
  var stroke = hexContents.addProperty("ADBE Vector Graphic - Stroke");
  stroke.property("Color").expression = 'effect("Hexagon Color")("Color")';
  stroke.property("Stroke Width").expression = 'effect("Stroke Thickness")("Slider")';

  // Rotation
  hexGroup.property("Transform").property("Rotation").expression =
    'effect("Hexagon Rotation")("Angle")';

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
