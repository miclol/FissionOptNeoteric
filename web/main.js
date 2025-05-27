$(() => { FissionOpt().then((FissionOpt) => {
  const run = $('#run'), pause = $('#pause'), stop = $('#stop');
  let opt = null, timeout = null;
  
  const updateDisables = () => {
    $('#settings input').prop('disabled', opt !== null);
    $('#settings a')[opt === null ? 'removeClass' : 'addClass']('disabledLink');
    run[timeout === null ? 'removeClass' : 'addClass']('disabledLink');
    pause[timeout !== null ? 'removeClass' : 'addClass']('disabledLink');
    stop[opt !== null ? 'removeClass' : 'addClass']('disabledLink');
  };

  const fuelBasePower = $('#fuelBasePower');
  const fuelBaseHeat = $('#fuelBaseHeat');
  const fuelPresets = {
    DefTBU: [120, 18],
    DefTBUO: [168, 22.5],
    DefTBUN: [192, 34],
    DefTBUZ: [150, 25],
    DefLEU235: [240, 50],
    DefLEU235O: [336, 62.5],
    DefLEU235N: [384, 94],
    DefLEU235Z: [300, 69],
    DefHEU235: [960, 300],
    DefHEU235O: [1344, 375],
    DefHEU235N: [1536, 563],
    DefHEU235Z: [1200, 413],
    DefLEU233: [288, 60],
    DefLEU233O: [403, 75],
    DefLEU233N: [460, 113],
    DefLEU233Z: [360, 83],
    DefHEU233: [1152, 360],
    DefHEU233O: [1612, 450],
    DefHEU233N: [1843, 675],
    DefHEU233Z: [1440, 496],
    DefLEN236: [180, 36],
    DefLEN236O: [251, 45],
    DefLEN236N: [288, 68],
    DefLEN236Z: [225, 50],
    DefHEN236: [720, 216],
    DefHEN236O: [1007, 270],
    DefHEN236N: [1152, 405],
    DefHEN236Z: [900, 297],
    DefMIX239: [310.8, 57.5],
    DefMIX239O: [435, 71.875],
    DefMIX239N: [497, 108],
    DefMIX239Z: [388, 80],
    DefMIX241: [487.2, 97.5],
    DefMIX241O: [682, 121.875],
    DefMIX241N: [779, 183],
    DefMIX241Z: [609, 135],
    DefLEP239: [210, 40],
    DefLEP239O: [294, 50],
    DefLEP239N: [336, 75],
    DefLEP239Z: [262, 56],
    DefHEP239: [840, 240],
    DefHEP239O: [1176, 300],
    DefHEP239N: [1344, 450],
    DefHEP239Z: [1050, 330],
    DefLEP241: [330, 70],
    DefLEP241O: [461, 87.5],
    DefLEP241N: [528, 132],
    DefLEP241Z: [412, 97],
    DefHEP241: [1320, 420],
    DefHEP241O: [1847, 525],
    DefHEP241N: [2112, 788],
    DefHEP241Z: [1650, 578],
    DefLEA242: [384, 94],
    DefLEA242O: [537, 117.5],
    DefLEA242N: [614, 177],
    DefLEA242Z: [480, 130],
    DefHEA242: [1536, 564],
    DefHEA242O: [2150, 705],
    DefHEA242N: [2457, 1058],
    DefHEA242Z: [1920, 776],
    DefLECm243: [420, 112],
    DefLECm243O: [588, 140],
    DefLECm243N: [672, 210],
    DefLECm243Z: [525, 154],
    DefHECm243: [1680, 672],
    DefHECm243O: [2352, 840],
    DefHECm243N: [2688, 1260],
    DefHECm243Z: [2100, 925],
    DefLECm245: [324, 68],
    DefLECm245O: [453, 85],
    DefLECm245N: [518, 128],
    DefLECm245Z: [405, 94],
    DefHECm245: [1296, 408],
    DefHECm245O: [1814, 510],
    DefHECm245N: [2073, 765],
    DefHECm245Z: [1620, 561],
    DefLECm247: [276, 54],
    DefLECm247O: [386, 67.5],
    DefLECm247N: [441, 102],
    DefLECm247Z: [345, 75],
    DefHECm247: [1104, 324],
    DefHECm247O: [1545, 405],
    DefHECm247N: [1766, 608],
    DefHECm247Z: [1380, 446],
    DefLEB248: [270, 52],
    DefLEB248O: [378, 65],
    DefLEB248N: [432, 98],
    DefLEB248Z: [337, 72],
    DefHEB248: [1080, 312],
    DefHEB248O: [1512, 390],
    DefHEB248N: [1728, 585],
    DefHEB248Z: [1350, 430],
    DefLECf249: [432, 116],
    DefLECf249O: [604, 145],
    DefLECf249N: [691, 218],
    DefLECf249Z: [540, 160],
    DefHECf249: [1728, 696],
    DefHECf249O: [2419, 870],
    DefHECf249N: [2764, 1305],
    DefHECf249Z: [2160, 958],
    DefLECf251: [450, 120],
    DefLECf251O: [630, 150],
    DefLECf251N: [720, 225],
    DefLECf251Z: [562, 165],
    DefHECf251: [1800, 720],
    DefHECf251O: [2520, 900],
    DefHECf251N: [2880, 1350],
    DefHECf251Z: [2250, 991]
  };
  for (const [name, [power, heat]] of Object.entries(fuelPresets)) {
    $('#' + name).click(() => {
      if (opt !== null)
        return;
      fuelBasePower.val(power);
      fuelBaseHeat.val(heat);
    });
  }
  
  const rates = [], limits = [];
  $('#rate input').each(function() { rates.push($(this)); });
  $('#activeRate input').each(function() { rates.push($(this)); });
  $('#limit input').each(function() { limits.push($(this)); });
  {
    const tail = limits.splice(-2);
    $('#activeLimit input').each(function() { limits.push($(this)); });
    limits.push(...tail);
  }
  const loadRatePreset = (preset) => {
    if (opt !== null)
      return;
    $.each(rates, (i, x) => { x.val(preset[i]); });
  };
  $('#DefRate').click(() => { loadRatePreset([
    60, 90, 140, 120, 160, 185, 90, 120, 130, 120, 150, 80, 160, 80, 120, 110, 150, 40,
    135, 115, 40, 175, 180, 160, 170, 160, 70, 60, 95, 145, 130, 150, 270, 420, 360,
    480, 555, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]); });

  $("#temperatureList").on("change", function() {$("#temperature").val(this.value)});

  const schedule = () => {
    timeout = window.setTimeout(step, 0);
  };

  const settings = new FissionOpt.FissionSettings();
  const design = $('#design');
  const save = $('#save');
  const nCoolerTypes = 30, air = nCoolerTypes * 2 + 2;
  const tileNames = ['Wt', 'Rs', 'He', 'Ed', 'Cr', 'N', 'Qz', 'Au', 'Gs', 'Lp', 'Dm', 'Fe', 'Em', 'Cu', 'Sn', 'Mg', 'Mn', 'En', 'As', 'Pm', 'Ob', 'Al', 'Vi', 'B', 'Ag', 'Fl', 'Nr', 'Pb', 'Pr', 'Sm', 'Li', '[]', '##', '..'];
  const tileTitles = ['Water', 'Redstone', 'Liquid Helium', 'Enderium', 'Cryotheum', 'Liquid Nitrogen', 'Quartz', 'Gold', 'Glowstone', 'Lapis', 'Diamond',
    'Iron', 'Emerald', 'Copper', 'Tin', 'Magnesium', 'Manganese', 'End Stone', 'Arsenic', 'Prismarine', 'Obsidian', 'Aluminium',
    'Villiaumite', 'Boron', 'Silver', 'Fluorite', 'Nether Brick', 'Lead', 'Purpur', 'Slime', 'Lithium', 'Reactor Cell', 'Moderator', 'Air'];
  $('#blockType>:not(:first)').each((i, x) => { $(x).attr('title', tileTitles[i]); });
  const tileClasses = tileNames.slice();
  tileClasses[31] = 'cell';
  tileClasses[32] = 'mod';
  tileClasses[33] = 'air';
  const tileSaveNames = tileTitles.slice(0, 32);
  tileSaveNames[2] = 'Helium';
  tileSaveNames[5] = 'Nitrogen';
  tileSaveNames[17] = 'EndStone';
  tileSaveNames[26] = 'NetherBrick';
  tileSaveNames[31] = 'FuelCell';
  tileSaveNames[32] = 'Graphite';

  const displayTile = (tile) => {
    let active = false;
    if (tile >= nCoolerTypes) {
      tile -= nCoolerTypes;
      if (tile < nCoolerTypes)
        active = true;
    }
    const result = $('<span>' + tileNames[tile] + '</span>').addClass(tileClasses[tile]);
    if (active) {
      result.attr('title', 'Active ' + tileTitles[tile]);
      result.css('outline', '2px dashed black')
    } else {
      result.attr('title', tileTitles[tile]);
    }
    return result;
  };

  const saveTile = (tile) => {
    if (tile >= nCoolerTypes) {
      tile -= nCoolerTypes;
      if (tile < nCoolerTypes) {
        return "Active " + tileSaveNames[tile];
      }
    }
    return tileSaveNames[tile];
  };

  const displaySample = (sample) => {  // TODO: Fix Avg Power, relationship not linear
    design.empty();
    let block = $('<div></div>');
    const appendInfo = (label, value, unit) => {
      const row = $('<div></div>').addClass('info');
      row.append('<div>' + label + '</div>');
      row.append('<div>' + unit + '</div>');
      row.append(Math.round(value * 100) / 100);
      block.append(row);
    };
    appendInfo('Max Power', sample.getPower(), 'RF/t');
    appendInfo('Heat', sample.getHeat(), 'H/t');
    appendInfo('Cooling', sample.getCooling(), 'H/t');
    appendInfo('Net Heat', sample.getNetHeat(), 'H/t');
    appendInfo('Duty Cycle', sample.getDutyCycle() * 100, '%');
    appendInfo('Fuel Use Rate', sample.getAvgBreed(), '&times;');
    appendInfo('Efficiency', sample.getEfficiency() * 100, '%');
    appendInfo('Avg Power', sample.getAvgPower(), 'RF/t');
    design.append(block);

    const shapes = [], strides = [], data = sample.getData();
    for (let i = 0; i < 3; ++i) {
      shapes.push(sample.getShape(i));
      strides.push(sample.getStride(i));
    }
    let resourceMap = {};
    const saved = {
      UsedFuel: {name: '', FuelTime: 0.0, BasePower: settings.fuelBasePower, BaseHeat: settings.fuelBaseHeat},
      SaveVersion: {Major: 1, Minor: 2, Build: 24, Revision: 0, MajorRevision: 0, MinorRevision: 0},
      InteriorDimensions: {X: shapes[2], Y: shapes[0], Z: shapes[1]},
      CompressedReactor: {}
    };
    resourceMap[-1] = (shapes[0] * shapes[1] + shapes[1] * shapes[2] + shapes[2] * shapes[0]) * 2;
    for (let x = 0; x < shapes[0]; ++x) {
      block = $('<div></div>');
      block.append('<div>Layer ' + (x + 1) + '</div>');
      for (let y = 0; y < shapes[1]; ++y) {
        const row = $('<div></div>').addClass('row');
        for (let z = 0; z < shapes[2]; ++z) {
          if (z)
            row.append(' ');
          const tile = data[x * strides[0] + y * strides[1] + z * strides[2]];
          if (!resourceMap.hasOwnProperty(tile))
            resourceMap[tile] = 1;
          else
            ++resourceMap[tile];
          const savedTile = saveTile(tile);
          if (savedTile !== undefined) {
            if (!saved.CompressedReactor.hasOwnProperty(savedTile))
              saved.CompressedReactor[savedTile] = [];
            saved.CompressedReactor[savedTile].push({X: z + 1, Y: x + 1, Z: y + 1});
          }
          row.append(displayTile(tile));
        }
        block.append(row);
      }
      design.append(block);
    }

    save.removeClass('disabledLink');
    save.off('click').click(() => {
      const elem = document.createElement('a');
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(saved)], {type: 'text/json'}));
      elem.setAttribute('href', url);
      elem.setAttribute('download', 'reactor.json');
      elem.click();
      window.URL.revokeObjectURL(url);
    });

    block = $('<div></div>');
    block.append('<div>Total number of blocks used</div>')
    resourceMap = Object.entries(resourceMap);
    resourceMap.sort((x, y) => y[1] - x[1]);
    for (resource of resourceMap) {
      if (resource[0] == air)
        continue;
      const row = $('<div></div>');
      if (resource[0] < 0)
        row.append('Casing');
      else
        row.append(displayTile(resource[0]).addClass('row'));
      block.append(row.append(' &times; ' + resource[1]));
    }
    design.append(block);
  };

  const progress = $('#progress');
  let lossElement, lossPlot;
  function step() {
    schedule();
    opt.stepInteractive();
    const nStage = opt.getNStage();
    if (nStage == -2)
      progress.text('Episode ' + opt.getNEpisode() + ', training iteration ' + opt.getNIteration());
    else if (nStage == -1)
      progress.text('Episode ' + opt.getNEpisode() + ', inference iteration ' + opt.getNIteration());
    else
      progress.text('Episode ' + opt.getNEpisode() + ', stage ' + nStage + ', iteration ' + opt.getNIteration());
    if (opt.needsRedrawBest())
      displaySample(opt.getBest());
    if (opt.needsReplotLoss()) {
      const data = opt.getLossHistory();
      while (lossPlot.data.labels.length < data.length)
        lossPlot.data.labels.push(lossPlot.data.labels.length);
      lossPlot.data.datasets[0].data = data;
      lossPlot.update({duration: 0});
    }
  };

  run.click(() => {
    if (timeout !== null)
      return;
    if (opt === null) {
      const parseSize = (x) => {
        const result = parseInt(x);
        if (!(result > 0))
          throw Error("Core size must be a positive integer");
        return result;
      };
      const parsePositiveFloat = (name, x) => {
        const result = parseFloat(x);
        if (!(result >= 0))
          throw Error(name + " must be a positive number");
        return result;
      };
      const parseValidFloat = (name, x) => {
        const result = parseFloat(x);
        if (isNaN(parseFloat(x)))
          throw Error(name + " must be a number");
        return result;
      };
      try {
        settings.sizeX = parseSize($('#sizeX').val());
        settings.sizeY = parseSize($('#sizeY').val());
        settings.sizeZ = parseSize($('#sizeZ').val());
        settings.fuelBasePower = parsePositiveFloat('Fuel Base Power', fuelBasePower.val());
        settings.fuelBaseHeat = parsePositiveFloat('Fuel Base Heat', fuelBaseHeat.val());
        settings.ensureHeatNeutral = $('#ensureHeatNeutral').is(':checked');
        settings.goal = parseInt($('input[name=goal]:checked').val());
        settings.symX = $('#symX').is(':checked');
        settings.symY = $('#symY').is(':checked');
        settings.symZ = $('#symZ').is(':checked');
        settings.temperature = parseValidFloat('Temperature', $('#temperature').val());
        settings.altCalc = $('altCalc').is(':checked');
        settings.generationMultiplier = parsePositiveFloat('Generation Multiplier', $('#generationMultiplier').val());
        settings.heatCapacity = parsePositiveFloat('Heat Capacity', $('#heatCapacity').val());
        settings.heatMultiplier = parsePositiveFloat('Heat Multiplier', $('#heatMultiplier').val());
        settings.heatMultiplierCap = parsePositiveFloat('Heat Multiplier Cap', $('#heatMultiplierCap').val());
        settings.moderatorFEMultiplier = parsePositiveFloat('Moderator FE Multiplier', $('#moderatorFEMultiplier').val());
        settings.moderatorHeatMultiplier = parsePositiveFloat('Moderator Heat Multiplier', $('#moderatorHeatMultiplier').val());
        settings.FEGenerationMultiplier = parsePositiveFloat('FE Generation Multiplier', $('#FEGenerationMultiplier').val());
        settings.activeHeatsinkPrime = $('activeHeatsinkPrime').is(':checked');
        $.each(rates, (i, x) => { settings.setRate(i, parsePositiveFloat('Cooling Rate', x.val())); });
        $.each(limits, (i, x) => {
          x = parseInt(x.val());
          settings.setLimit(i, x >= 0 ? x : -1);
        });
      } catch (error) {
        alert('Error: ' + error.message);
        return;
      }
      design.empty();
      save.off('click');
      save.addClass('disabledLink');
      if (lossElement !== undefined)
        lossElement.remove();
      const useNet = $('#useNet').is(':checked');
      if (useNet) {
        lossElement = $('<canvas></canvas>').attr('width', 1024).attr('height', 128).insertAfter(progress);
        lossPlot = new Chart(lossElement[0].getContext('2d'), {
          type: 'bar',
          options: {responsive: false, animation: {duration: 0}, hover: {animationDuration: 0}, scales: {xAxes: [{display: false}]}, legend: {display: false}},
          data: {labels: [], datasets: [{label: 'Loss', backgroundColor: 'red', data: [], categoryPercentage: 1.0, barPercentage: 1.0}]}
        });
      }
      opt = new FissionOpt.FissionOpt(settings, useNet);
    }
    schedule();
    updateDisables();
  });

  pause.click(() => {
    if (timeout === null)
      return;
    window.clearTimeout(timeout);
    timeout = null;
    updateDisables();
  });

  stop.click(() => {
    if (opt === null)
      return;
    if (timeout !== null) {
      window.clearTimeout(timeout);
      timeout = null;
    }
    opt.delete();
    opt = null;
    updateDisables();
  });
}); });
