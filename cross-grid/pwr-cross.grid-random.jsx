var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
  alert("Please select a composition.");
} else {
  app.beginUndoGroup("Grid of Crosses with Random Fades");

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
    return s;
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

  // Fade settings
  addSlider("Fade Duration (s)", 0.5);
  addSlider("Transition Probability (%)", 50);
  addSlider("Min Hold Time (s)", 1);
  addSlider("Max Hold Time (s)", 3);

  var baseSize = 288;
  var columns = 5;
  var rows = 9;

  var centerXIndex = 2;
  var centerYIndex = 4;

  var contents = shapeLayer.property("Contents");

  // Create individual crosses for independent twinkling
  for (var row = 0; row < rows; row++) {
    for (var col = 0; col < columns; col++) {
      var crossGroup = contents.addProperty("ADBE Vector Group");
      crossGroup.name = "Cross " + row + "-" + col;
      var crossContents = crossGroup.property("Contents");

      // Add horizontal and vertical rectangles
      var horiz = crossContents.addProperty("ADBE Vector Shape - Rect");
      horiz.name = "Horizontal";
      horiz.property("Size").expression =
        'sx = 288 * (effect("Horizontal Size (%)")("Slider") / 100);\n' +
        't = effect("Cross Thickness")("Slider");\n' +
        '[sx, t]';

      var vert = crossContents.addProperty("ADBE Vector Shape - Rect");
      vert.name = "Vertical";
      vert.property("Size").expression =
        'sy = 288 * (effect("Vertical Size (%)")("Slider") / 100);\n' +
        't = effect("Cross Thickness")("Slider");\n' +
        '[t, sy]';

      var fill = crossContents.addProperty("ADBE Vector Graphic - Fill");
      fill.property("Color").expression = 'effect("Cross Color")("Color")';

      // Add Transform group to crossGroup
      var crossTransform = crossGroup.property("Transform");
      crossTransform.property("Rotation").expression = 'effect("Cross Rotation")("Angle")';

      // Position each cross
      var xPos = (col - centerXIndex) * baseSize;
      var yPos = (row - centerYIndex) * baseSize;
      crossTransform.property("Position").setValue([xPos, yPos]);

      // Add independent opacity expression to each cross
      crossTransform.property("Opacity").expression =
        'seedRandom(' + (row * 1000 + col) + ', true);\n' +
        'fadeDur = effect("Fade Duration (s)")("Slider");\n' +
        'prob = effect("Transition Probability (%)")("Slider") / 100;\n' +
        'minHold = effect("Min Hold Time (s)")("Slider");\n' +
        'maxHold = effect("Max Hold Time (s)")("Slider");\n' +
        'hold = random(minHold, maxHold);\n' +
        'cycle = fadeDur * 2 + hold;\n' +
        'phase = random(0, 1);\n' +
        'modTime = (time + phase * cycle) % cycle;\n' +
        'fadeIn = ease(modTime, 0, fadeDur, 0, 100);\n' +
        'fadeOut = ease(modTime, cycle - fadeDur, cycle, 100, 0);\n' +
        'random() < prob ? (modTime < fadeDur ? fadeIn : (modTime > cycle - fadeDur ? fadeOut : 100)) : 0;';
    }
  }

  // Position the shape layer in the center of comp
  shapeLayer.property("Transform").property("Position").setValue([
    comp.width / 2,
    comp.height / 2
  ]);

  // Add scale expression to shape layer transform
  shapeLayer.property("Transform").property("Scale").expression =
    'zoom = effect("Grid Zoom (%)")("Slider"); [zoom, zoom];';

  app.endUndoGroup();
}
