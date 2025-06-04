(function () {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      alert("Please select a composition.");
      return;
    }
  
    app.beginUndoGroup("Line with Trim Paths");
  
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
    shapeLayer.name = "Line Path " + uniqueSuffix;
  
    var contents = shapeLayer.property("Contents");
    var group = contents.addProperty("ADBE Vector Group");
    group.name = "Line Group";
  
    var shape = group.property("Contents").addProperty("ADBE Vector Shape - Group");
    var pathProp = shape.property("Path");
  
    // Define the points
    var baseSize = 72;
    var renderList = [
        { x: 18, y: 16 },
        { x: 2, y: 16 },
        { x: 2, y: 25 },
        { x: 18, y: 25 },
        { x: 18, y: 16 }
    ];
  
    if (renderList.length === 0) {
      alert("renderList is empty!");
      app.endUndoGroup();
      return;
    }
  
    // Convert to comp-space coordinates
    var vertices = [];
    for (var i = 0; i < renderList.length; i++) {
      var pos = renderList[i];
      vertices.push([pos.x * baseSize, pos.y * baseSize]);
    }
  
    // Find minX and minY
    var minX = vertices[0][0];
    var minY = vertices[0][1];
    for (var i = 1; i < vertices.length; i++) {
      if (vertices[i][0] < minX) minX = vertices[i][0];
      if (vertices[i][1] < minY) minY = vertices[i][1];
    }
  
    // Offset to local layer space
    var shiftedVerts = [];
    for (var i = 0; i < vertices.length; i++) {
      shiftedVerts.push([vertices[i][0] - minX, vertices[i][1] - minY]);
    }
  
    var shapeData = new Shape();
    shapeData.vertices = shiftedVerts;
    shapeData.closed = false;
    pathProp.setValue(shapeData);
  
    // Stroke
    var stroke = group.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("Color").setValue([1, 1, 1]);
    stroke.property("Stroke Width").setValue(4);
  
    // Trim Paths
    var trim = group.property("Contents").addProperty("ADBE Vector Filter - Trim");
    trim.property("Start").setValue(0);
    trim.property("End").setValue(0); // You can animate this
  
    // Position the shape layer correctly
    shapeLayer.property("Transform").property("Position").setValue([minX, minY]);
  
    app.endUndoGroup();
  })();  