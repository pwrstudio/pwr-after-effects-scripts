function fadeInLinesUI() {
    var win = new Window("palette", "Fade In Lines", undefined);
    win.orientation = "column";
    win.alignChildren = "left";
  
    win.add("statictext", undefined, "Enter lines:");
    var textInput = win.add("edittext", undefined, "Line 1\nLine 2\nLine 3", {
      multiline: true,
      scrolling: true
    });
    textInput.preferredSize = [400, 200];
  
    win.add("statictext", undefined, "Line spacing (pixels):");
    var spacingInput = win.add("edittext", undefined, "100");
    spacingInput.characters = 5;
  
    var goBtn = win.add("button", undefined, "Create");
  
    goBtn.onClick = function () {
      var comp = app.project.activeItem;
      if (!(comp instanceof CompItem)) {
        alert("No comp active.");
        return;
      }
  
      var spacing = parseInt(spacingInput.text, 10);
      if (isNaN(spacing)) spacing = 100;
  
      var rawText = textInput.text;
      var splitLines = rawText.split(/\r?\n/);
      var lines = [];
      for (var i = 0; i < splitLines.length; i++) {
        var trimmed = splitLines[i].replace(/^\s+|\s+$/g, "");
        if (trimmed !== "") {
          lines.push(trimmed);
        }
      }
  
      var numLines = lines.length;
  
      app.beginUndoGroup("Create Highlightable Text");
  
      // Control null with two sliders
      var ctrlLayer = comp.layers.addNull();
      ctrlLayer.name = "Control";
  
      var progressSlider = ctrlLayer.Effects.addProperty("ADBE Slider Control");
      progressSlider.name = "Progress";
      progressSlider.property("Slider").setValue(0);
  
      var highlightSlider = ctrlLayer.Effects.addProperty("ADBE Slider Control");
      highlightSlider.name = "Highlight Index (0–" + numLines + ")";
      highlightSlider.property("Slider").setValue(0);
  
      for (var i = 0; i < numLines; i++) {
        var textLayer = comp.layers.addText(lines[i]);
        var y = 300 + i * spacing;
        textLayer.property("Position").setValue([960, y]);
  
        textLayer.blendingMode = BlendingMode.DIFFERENCE;
  
        var expr =
          "ctrl = thisComp.layer('Control');\n" +
          "progress = ctrl.effect('Progress')('Slider');\n" +
          "highlight = Math.round(Math.max(0, Math.min(ctrl.effect('Highlight Index (0–" + numLines + ")')('Slider'), " + numLines + ")));\n" +
          "step = 100 / " + numLines + ";\n" +
          "idx = " + (i + 1) + ";\n" +
          "fadeStart = step * (idx - 1);\n" +
          "fadeEnd = fadeStart + step;\n" +
          "fade = ease(progress, fadeStart, fadeEnd, 0, 100);\n" +
          "highlight == idx ? 100 : fade;";
  
        textLayer.opacity.expression = expr;
      }
  
      app.endUndoGroup();
      win.close();
    };
  
    win.center();
    win.show();
  }
  
  fadeInLinesUI();
  