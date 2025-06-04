var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
  alert("Please select a composition.");
} else {
  app.beginUndoGroup("Grid of Crosses with Offsets (Final Fix)");

  var shapeLayer = comp.layers.addShape();
  shapeLayer.name = "PWR Cross Grid Small";

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
  addSlider("Column Start Offset", 0);
  addSlider("Column End Offset", 0);
  addSlider("Row Start Offset", 0);
  addSlider("Row End Offset", 0);
  addAngle("Cross Rotation", 0);
  addColor("Cross Color", 1, 1, 1);

  var baseSize = 144; // 288
  var columns = 10; // 5
  var rows = 18; // 9

  var contents = shapeLayer.property("Contents");

  // === Wrapper group for full grid
  var wrapperGroup = contents.addProperty("ADBE Vector Group");
  wrapperGroup.name = "Grid Wrapper";
  var wrapperContents = wrapperGroup.property("Contents");

  // === Cross X group
  var xGroup = wrapperContents.addProperty("ADBE Vector Group");
  xGroup.name = "Cross X";
  var xContents = xGroup.property("Contents");

  // Cross
  var crossGroup = xContents.addProperty("ADBE Vector Group");
  crossGroup.name = "Cross";
  var crossContents = crossGroup.property("Contents");

  var horiz = crossContents.addProperty("ADBE Vector Shape - Rect");
  horiz.name = "Horizontal";
  horiz.property("Size").expression =
    'sx = 288 * (effect("Horizontal Size (%)")("Slider") / 100);' +
    't = effect("Cross Thickness")("Slider");' +
    '[sx, t]';

  var vert = crossContents.addProperty("ADBE Vector Shape - Rect");
  vert.name = "Vertical";
  vert.property("Size").expression =
    'sy = 288 * (effect("Vertical Size (%)")("Slider") / 100);' +
    't = effect("Cross Thickness")("Slider");' +
    '[t, sy]';

  var fill = crossContents.addProperty("ADBE Vector Graphic - Fill");
  fill.property("Color").expression = 'effect("Cross Color")("Color")';

  crossGroup.property("Transform").property("Rotation").expression = 'effect("Cross Rotation")("Angle")';

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
