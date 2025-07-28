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
    DefTBU: [120, 18], DefTBUO: [168, 22.5], DefTBUN: [192, 34], DefTBUZ: [150, 25],
    DefLEU235: [240, 50], DefLEU235O: [336, 62.5], DefLEU235N: [384, 94], DefLEU235Z: [300, 69],
    DefHEU235: [960, 300], DefHEU235O: [1344, 375], DefHEU235N: [1536, 563], DefHEU235Z: [1200, 413],
    DefLEU233: [288, 60], DefLEU233O: [403, 75], DefLEU233N: [460, 113], DefLEU233Z: [360, 83],
    DefHEU233: [1152, 360], DefHEU233O: [1612, 450], DefHEU233N: [1843, 675], DefHEU233Z: [1440, 496],
    DefLEN236: [180, 36], DefLEN236O: [251, 45], DefLEN236N: [288, 68], DefLEN236Z: [225, 50],
    DefHEN236: [720, 216], DefHEN236O: [1007, 270], DefHEN236N: [1152, 405], DefHEN236Z: [900, 297],
    DefMIX239: [310.8, 57.5], DefMIX239O: [435, 71.875], DefMIX239N: [497, 108], DefMIX239Z: [388, 80],
    DefMIX241: [487.2, 97.5], DefMIX241O: [682, 121.875], DefMIX241N: [779, 183], DefMIX241Z: [609, 135],
    DefLEP239: [210, 40], DefLEP239O: [294, 50], DefLEP239N: [336, 75], DefLEP239Z: [262, 56],
    DefHEP239: [840, 240], DefHEP239O: [1176, 300], DefHEP239N: [1344, 450], DefHEP239Z: [1050, 330],
    DefLEP241: [330, 70], DefLEP241O: [461, 87.5], DefLEP241N: [528, 132], DefLEP241Z: [412, 97],
    DefHEP241: [1320, 420], DefHEP241O: [1847, 525], DefHEP241N: [2112, 788], DefHEP241Z: [1650, 578],
    DefLEA242: [384, 94], DefLEA242O: [537, 117.5], DefLEA242N: [614, 177], DefLEA242Z: [480, 130],
    DefHEA242: [1536, 564], DefHEA242O: [2150, 705], DefHEA242N: [2457, 1058], DefHEA242Z: [1920, 776],
    DefLECm243: [420, 112], DefLECm243O: [588, 140], DefLECm243N: [672, 210], DefLECm243Z: [525, 154],
    DefHECm243: [1680, 672], DefHECm243O: [2352, 840], DefHECm243N: [2688, 1260], DefHECm243Z: [2100, 925],
    DefLECm245: [324, 68], DefLECm245O: [453, 85], DefLECm245N: [518, 128], DefLECm245Z: [405, 94],
    DefHECm245: [1296, 408], DefHECm245O: [1814, 510], DefHECm245N: [2073, 765], DefHECm245Z: [1620, 561],
    DefLECm247: [276, 54], DefLECm247O: [386, 67.5], DefLECm247N: [441, 102], DefLECm247Z: [345, 75],
    DefHECm247: [1104, 324], DefHECm247O: [1545, 405], DefHECm247N: [1766, 608], DefHECm247Z: [1380, 446],
    DefLEB248: [270, 52], DefLEB248O: [378, 65], DefLEB248N: [432, 98], DefLEB248Z: [337, 72],
    DefHEB248: [1080, 312], DefHEB248O: [1512, 390], DefHEB248N: [1728, 585], DefHEB248Z: [1350, 430],
    DefLECf249: [432, 116], DefLECf249O: [604, 145], DefLECf249N: [691, 218], DefLECf249Z: [540, 160],
    DefHECf249: [1728, 696], DefHECf249O: [2419, 870], DefHECf249N: [2764, 1305], DefHECf249Z: [2160, 958],
    DefLECf251: [450, 120], DefLECf251O: [630, 150], DefLECf251N: [720, 225], DefLECf251Z: [562, 165],
    DefHECf251: [1800, 720], DefHECf251O: [2520, 900], DefHECf251N: [2880, 1350], DefHECf251Z: [2250, 991],
    PreMoniTBU: [4800, 18], PreMoniLEU235: [9600, 50], PreMoniHEU235: [38400, 300],
    PreMoniLEU233: [11520, 60], PreMoniHEU233: [46080, 360], PreMoniLEN236: [7200, 36], PreMoniHEN236: [28800, 216],
    PreMoniLEP239: [8400, 40], PreMoniHEP239: [33600, 240], PreMoniLEP241: [13200, 70], PreMoniHEP241: [52800, 420],
    PreMoniLEA242: [15360, 94], PreMoniHEA242: [61440, 564], PreMoniLECm243: [16800, 112], PreMoniHECm243: [67200, 672],
    PreMoniLECm245: [12960, 68], PreMoniHECm245: [51840, 408], PreMoniLECm247: [11040, 54], PreMoniHECm247: [44160, 324],
    PreMoniLEB248: [10800, 52], PreMoniHEB248: [43200, 312], PreMoniLECf249: [17280, 116], PreMoniHECf249: [69120, 696],
    PreMoniLECf251: [18000, 120], PreMoniHECf251: [72000, 720], oldLEB248: [1080, 52], PostMoniTBU: [4800, 27],
    PostMoniLEU235: [12960, 50], PostMoniHEU235: [51840, 150], PostMoniLEU233: [17280, 60], PostMoniHEU233: [69120, 180],
    PostMoniLEN236: [7200, 36], PostMoniHEN236: [28800, 108], PostMoniLEP239: [9600, 40], PostMoniHEP239: [38400, 120],
    PostMoniLEP241: [23520, 70], PostMoniHEP241: [94080, 210], PostMoniLEA242: [26880, 94], PostMoniHEA242: [107520, 282],
    PostMoniLECm243: [30720, 112], PostMoniHECm243: [122880, 336], PostMoniLECm245: [20640, 68], PostMoniHECm245: [82560, 204],
    PostMoniLECm247: [16320, 54], PostMoniHECm247: [65280, 162], PostMoniLEB248: [15360, 52], PostMoniHEB248: [61440, 156],
    PostMoniLECf249: [34560, 116], PostMoniHECf249: [138240, 348], PostMoniLECf251: [36000, 120], PostMoniHECf251: [144000, 360]
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
  const loadLimitPreset = (preset) => {
    if (opt !== null)
      return;
    $.each(limits, (i, x) => { preset[i] >= 0 ? x.val(preset[i]) : x.val(null); });
  };
  $('#DefRate').click(() => { loadRatePreset([
    60, 90, 140, 120, 160, 185, 90, 120, 130, 120, 150, 80, 160, 80, 120, 110, 150, 40,
    135, 115, 40, 175, 180, 160, 170, 160, 70, 60, 95, 145, 130, 150, 270, 420, 360,
    480, 555, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]); loadLimitPreset([
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]); });
  $('#PreMoniRate').click(() => { loadRatePreset([
    60, 90, 140, 120, 160, 185, 90, 120, 130, 120, 150, 80, 160, 80, 120, 110, 150, 40,
    135, 115, 40, 175, 180, 160, 170, 160, 70, 60, 95, 145, 130, 250, 270, 420, 360,
    480, 555, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]); loadLimitPreset([
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]); });
  $('#PostMoniRate').click(() => { loadRatePreset([
    60, 90, 140, 120, 200, 0, 90, 0, 130, 120, 0, 0, 160, 80, 120, 110, 150, 0, 0, 0, 0,
    175, 0, 160, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]); loadLimitPreset([
    -1, -1, -1, -1, -1, 0, -1, 0, -1, -1, 0, 0, -1, -1, -1, -1, -1, 0, 0, 0, 0, -1, 0,
    -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]); });
  $('#removeVilliaumite').click(() => { rates[22].val(0); rates[53].val(0); limits[22].val(0); limits[53].val(0); });
  $('#temperatureList').on('change', function() {$('#temperature').val(this.value)});
  const setConfig = (altCalc, genMult, heatMult, modFEMult, modHeatMult, FEGenMult, activeHeatsinkPrime) => {
    console.log("Hi!");
    $("#altCalc").prop("checked", altCalc);
    $("#genMult").val(genMult);
    $("#heatMult").val(heatMult);
    $("#modFEMult").val(modFEMult);
    $("#modHeatMult").val(modHeatMult);
    $("#FEGenMult").val(FEGenMult);
    $("#activeHeatsinkPrime").prop("checked", activeHeatsinkPrime);
  };
  $("#DefConf").click(() => { setConfig(false, 1, 1, 16.67, 33.34, 10, true); });
  $("#AltConf").click(() => { setConfig(true, 1, 1, 16.666666667, 33.33333333, 10, true); });
  $("#PreMoniConf").click(() => { setConfig(false, 1, 3, 16.67, 33.34, 10, true); });
  $("#PostMoniConf").click(() => { setConfig(true, 1, 3, 16.67, 33.34, 5, true); });


  const schedule = () => {
    timeout = window.setTimeout(step, 0);
  };

  const settings = new FissionOpt.FissionSettings();
  const design = $('#design');
  const save = $('#save');
  const bgString = $('#bgString');
  const nCoolerTypes = 31, air = nCoolerTypes * 2 + 2;
  const tileNames = ['Wt', 'Rs', 'He', 'Ed', 'Cr', 'Nt', 'Qz', 'Au', 'Gs', 'Lp', 'Dm', 'Fe', 'Em', 'Cu', 'Sn', 'Mg',
    'Mn', 'En', 'As', 'Pm', 'Ob', 'Al', 'Vi', 'Bo', 'Ag', 'Fl', 'Nr', 'Pb', 'Pr', 'Sm', 'Li', '[]', '##', '..', '()'];
  const tileTitles = ['Water', 'Redstone', 'Liquid Helium', 'Enderium', 'Cryotheum', 'Liquid Nitrogen', 'Quartz', 'Gold', 'Glowstone', 'Lapis',
    'Diamond', 'Iron', 'Emerald', 'Copper', 'Tin', 'Magnesium', 'Manganese', 'End Stone', 'Arsenic', 'Prismarine', 'Obsidian', 'Aluminum',
    'Villiaumite', 'Boron', 'Silver', 'Fluorite', 'Nether Brick', 'Lead', 'Purpur', 'Slime', 'Lithium', 'Fuel Cell', 'Moderator', 'Air'];
  $('.blockType>:not(:first-child)').each((_, x) => { $(x).attr('title', tileTitles[$(x).index() - 1]); });
  const tileClasses = tileNames.slice();
  tileClasses[31] = 'cell';
  tileClasses[32] = 'mod';
  tileClasses[33] = 'air';
  tileClasses[34] = 'case';
  const tileSaveNames = tileTitles.slice(0, 32);
  tileSaveNames[31] = 'fission_reactor_solid_fuel_cell';
  tileSaveNames[32] = 'graphite_block';

  const highlightText = (text) => {
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    for (const [index, tileName] of Object.entries(tileNames)) {
      escapedText = tileName.replace(/[.[\]\(\)]/g, '\\$&');
      text = text.replace(new RegExp(`(${escapedText})`, 'g'), `<span class='${tileClasses[index]}'>$1</span>`);
    }
    return text;
  };

  const saveCaret = (editor) => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;

    const range = sel.getRangeAt(0);
    if (!editor[0].contains(range.startContainer)) return null;

    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editor[0]);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  const restoreCaret = (editor, pos) => {
    const sel = window.getSelection();
    const range = document.createRange();
    let charCount = 0;

    const root = editor[0];

    if (!root.firstChild) {
      root.appendChild(document.createTextNode(''));
    }

    const nodeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    let found = false;
    while (nodeWalker.nextNode()) {
      const node = nodeWalker.currentNode;
      const nextCount = charCount + node.length;

      if (pos <= nextCount) {
        range.setStart(node, pos - charCount);
        range.collapse(true);
        found = true;
        break;
      }

      charCount = nextCount;
    }

    if (!found) {
      const fallback = root.firstChild;
      range.setStart(fallback, 0);
      range.collapse(true);
    }

    sel.removeAllRanges();
    sel.addRange(range);
  };

  $('#rules div').on('input', function () {
    const editor = $(this);
    const caretPos = saveCaret(editor);
    editor.html(highlightText(editor.text()));
    if (caretPos != null) {
      restoreCaret(editor, caretPos);
    }
  });

  const loadRules = (rls) => { $('#rules div').each(function(index, rule) { $(rule).html(highlightText(rls[index])); }) };

  $('#DefRules').click(() => { loadRules(['[]|##', '[]', 'Rs,()', '()^3', '[]>2', 'Cu,Pr', '##', 'Wt,Rs', '##>2', '[],()', 'Cu,Qz', 'Au', '[],##',
    'Gs', 'Lp-2', '(),##', '[]>2', 'Ed', '##>3', 'Wt', 'Gs-2', 'Qz,Lp', 'Rs,En', 'Qz,()|##', 'Gs>2,Sn', 'Au,Pm', 'Ob', 'Fe', '(),Fe', 'Wt,Pb', 'Pb-2'
  ]); });
  $('#PreMoniRules').click(() => { loadRules(['[]|##', '[]', 'Rs,()', '()^3', '[]>2', 'Cu,Pr', '##', 'Wt,Rs', '##>2', '[],()', 'Wt,Qz', 'Au', '[],##',
    'Gs', 'Lp-2', '(),##', '[]>2', 'Ed', '##>3', 'Wt', 'Gs-2', 'Qz,Lp', 'Rs,En', 'Qz,()|##', 'Gs>2,Sn', 'Au,Pm', 'Ob', 'Fe', '(),Fe', 'Wt,Pb', 'Pb-2'
  ]); });
  $('#PostMoniRules').click(() => { loadRules(['[]|##', '[]', 'Rs,()', '()^3', '[]>2,##', 'Cu,Pr', '##', 'Wt,Rs', '##>2', '[],()', 'Wt,Qz', 'Au', '[],##',
    'Gs', 'Lp-2', '(),##', '[]>2', 'Ed', '##>3', 'Wt', 'Gs-2', 'Qz,Lp', 'Rs,En', 'Qz,()|##', 'Gs>2,Sn', 'Au,Pm', 'Ob', 'Fe', '(),Fe', 'Wt,Pb', 'Pb-2'
  ]); });

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
        return 'nuclearcraft:active_' + tileSaveNames[tile].toLowerCase().replaceAll(' ', '_') + '_heat_sink';
      } else {
        if (tile == tileTitles.length - 1) {
          return 'minecraft:air';
        } else {
          return 'nuclearcraft:' + tileSaveNames[tile];
        }
      }
    }
    return 'nuclearcraft:' + tileSaveNames[tile].toLowerCase().replaceAll(' ', '_') + '_heat_sink';
  };

  const displaySample = (sample) => {
    design.empty();
    let block = $('<div></div>');
    const appendInfo = (label, value, unit) => {
      const row = $('<div></div>').addClass('info');
      row.append('<div>' + label + '</div>');
      row.append('<div>' + unit + '</div>');
      row.append(Math.round(value * 100) / 100);
      block.append(row);
    };
    appendInfo('Max Power', sample.getPower(), 'FE/t');
    appendInfo('Heat', sample.getHeat(), 'H/t');
    appendInfo('Cooling', sample.getCooling(), 'H/t');
    appendInfo('Net Heat', sample.getNetHeat(), 'H/t');
    appendInfo('Duty Cycle', sample.getDutyCycle() * 100, '%');
    appendInfo('Fuel Use Rate', sample.getAvgBreed(), '&times;');
    appendInfo('Efficiency', sample.getEfficiency() * 100, '%');
    appendInfo('Avg Power', sample.getAvgPower(), 'FE/t');
    design.append(block);

    const shapes = [], strides = [], data = sample.getData();
    for (let i = 0; i < 3; ++i) {
      shapes.push(sample.getShape(i));
      strides.push(sample.getStride(i));
    }
    let resourceMap = {};
    resourceMap[-1] = (shapes[0] * shapes[1] + shapes[1] * shapes[2] + shapes[2] * shapes[0]) * 2 + (shapes[0] + shapes[1] + shapes[2]) * 4 + 8;
    for (let y = 0; y < shapes[0]; ++y) {
      block = $('<div></div>');
      block.append('<div>Layer ' + (y + 1) + '</div>');
      for (let z = 0; z < shapes[1]; ++z) {
        const row = $('<div></div>').addClass('row');
        for (let x = 0; x < shapes[2]; ++x) {
          if (x)
            row.append(' ');
          const tile = data[y * strides[0] + z * strides[1] + x * strides[2]];
          if (!resourceMap.hasOwnProperty(tile))
            resourceMap[tile] = 1;
          else
            ++resourceMap[tile];
          row.append(displayTile(tile));
        }
        block.append(row);
      }
      design.append(block);
    }

    save.removeClass('disabledLink');
    save.off('click').click(() => {
      import('https://cdn.jsdelivr.net/npm/nbtify@2.2.0/+esm').then(async (NBT) => {
        internalMap = {}, palette = {};
        let data = sample.getData();
        internalIndex = 0;
        blockData = new Int8Array(shapes[0] * shapes[1] * shapes[2]);
        for (let y = 0; y < shapes[0]; ++y) {
          for (let z = 0; z < shapes[1]; ++z) {
            for (let x = 0; x < shapes[2]; ++x) {
              const index = y * strides[0] + z * strides[1] + x * strides[2];
              const savedTile = saveTile(data[index]);
              if (!internalMap.hasOwnProperty(savedTile)) {
                palette[savedTile] = new NBT.Int32(internalIndex);
                blockData[index] = internalIndex;
                internalMap[savedTile] = internalIndex++;
              } else {
                blockData[index] = internalMap[savedTile];
              }
            }
          }
        }
        res = await NBT.write({Width: new NBT.Int16(shapes[2]), Height: new NBT.Int16(shapes[0]), Length: new NBT.Int16(shapes[1]), Version: new NBT.Int32(2),
                    DataVersion: new NBT.Int32(3465), PaletteMax: new NBT.Int32(Object.keys(palette).length), Palette: palette, BlockData: blockData});
        const elem = document.createElement('a');
        const url = window.URL.createObjectURL(new Blob([res]));
        elem.setAttribute('href', url);
        elem.setAttribute('download', 'reactor.schem');
        elem.click();
        window.URL.revokeObjectURL(url);
      });
    });

    bgString.removeClass('disabledLink');
    bgString.off('click').click(() => {
      internalMap = {};
      let data = sample.getData();
      internalIndex = 0;
      stateList = [];
      for (let y = 0; y < shapes[1]; ++y) {
        for (let z = 0; z < shapes[0]; ++z) {
          for (let x = 0; x < shapes[2]; ++x) {
            const savedTile = `{Name:\\'${saveTile(data[z * shapes[2] * shapes[1] + y * shapes[2] + x])}\\'}`;
            if (!internalMap.hasOwnProperty(savedTile)) {
              stateList.push(internalIndex);
              internalMap[savedTile] = internalIndex++;
            } else {
              stateList.push(internalMap[savedTile]);
            }
          }
        }
      }
      string = `{'statePosArrayList': '{blockstatemap:[${Object.keys(internalMap)}],startpos:{X:0,Y:0,Z:0},` +
      `endpos:{X:${shapes[2] - 1},Y:${shapes[0] - 1},Z:${shapes[1] - 1}},statelist:[I;${stateList}]}'}`;
      navigator.clipboard.writeText(string);
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
    if (!Promise.any) throw Error('Please update your browser to a newer version or use another browser!'); // ES12 test
    if (timeout !== null)
      return;
    if (opt === null) {
      const parseSize = (x) => {
        const result = parseInt(x);
        if (!(result > 0))
          throw Error('Core size must be a positive integer');
        return result;
      };
      const parseRuleInt = (index, x, low, high) => {
        const result = parseInt(x);
        if (result < low || result > high || isNaN(result))
          throw Error('Rule for ' + tileTitles[index] + ' is Invalid!');
        return result;
      };
      const parsePositiveFloat = (name, x) => {
        const result = parseFloat(x);
        if (!(result >= 0))
          throw Error(name + ' must be a positive number');
        return result;
      };
      const parseValidFloat = (name, x) => {
        const result = parseFloat(x);
        if (isNaN(parseFloat(x)))
          throw Error(name + ' must be a number');
        return result;
      };
      const findSCCs = (graph) => {
        let index = 0;
        const indices = {}, lowlinks = {}, stack = [], sccs = [];
        const onStack = new Set();
        const strongConnect = (node) => {
          indices[node] = lowlinks[node] = index++;
          stack.push(node);
          onStack.add(node);
          for (const neighbor of graph[node] ?? []) {
            if (indices[neighbor] === undefined) {
              strongConnect(neighbor);
              lowlinks[node] = Math.min(lowlinks[node], lowlinks[neighbor]);
            } else if (onStack.has(neighbor)) {
              lowlinks[node] = Math.min(lowlinks[node], indices[neighbor]);
            }
          }
          if (lowlinks[node] == indices[node]) {
            const scc = [];
            let w;
            do {
              w = stack.pop();
              onStack.delete(w);
              scc.push(w);
            } while (w != node);
            sccs.push(scc);
          }
        };
        for (const node in graph) {
          if (indices[node] === undefined) {
            strongConnect(node);
          }
        }
        return sccs;
      };
      const sortSCCs = (graph, sccs) => {
        const sccMap = {};
        sccs.forEach((scc, i) => { scc.forEach(node => sccMap[node] = i); });
        const sccTopo = Array(sccs.length).fill(0).map(() => new Set());
        for (const [node, deps] of Object.entries(graph)) {
          const from = sccMap[node];
          for (const dep of deps) {
            const to = sccMap[dep];
            if (from != to) {
              sccTopo[to].add(from);
            }
          }
        }
        const inDegree = Array(sccTopo.length).fill(0);
        sccTopo.forEach(neighbors => { neighbors.forEach(n => inDegree[n]++); });
        const queue = inDegree.flatMap((deg, i) => deg == 0 ? [i] : []);
        const order = [];
        while (queue.length > 0) {
          const node = queue.shift();
          order.push(node);
          for (const neighbor of sccTopo[node]) {
            if (--inDegree[neighbor] == 0) {
              queue.push(neighbor);
            }
          }
        }
        return order;
      };

      try {
        const ruleGraph = {};
        const rules = [];
        const ruleType = ['>', '=', '<', '-', '^'];
        $("#rules div").each(function(index, rule) {
          rules[index] = [];
          for (const [idx, rl] of Object.entries(rule.textContent.split(','))) {
            rules[index][idx] = [];
            for (const r of rl.split('|')) {
              const rule = r.split(/(?=[>=<\-^])|(?<=[>=<\-^])/g);
              if (tileNames.includes(rule[0])) {
                rule[1] ??= ">"; rule[2] ??= "1";
                const condition = ruleType.indexOf(rule[1]);
                const condAmt = rule[2];
                switch (condition) {
                  case 0:
                  case 1:
                  case 2:
                    parseRuleInt(index, condAmt, 1, 6);
                    break;
                  case 3:
                    parseRuleInt(index, condAmt, 2, 2);
                    break;
                  case 4:
                    parseRuleInt(index, condAmt, 2, 3);
                    break;
                }
                const depIdx = tileNames.indexOf(rule[0]);
                (ruleGraph[index] ??= []).push(String(depIdx));
                const conditions = (condAmt << 8) + (condition << 11);
                if (depIdx < nCoolerTypes) {
                  rules[index][idx].push(depIdx + conditions);
                }
                rules[index][idx].push(depIdx + nCoolerTypes + conditions);
              } else {
                throw Error('Rule for ' + tileTitles[index] + ' is Invalid!');
              }
            }
          }
        });
        const sccs = findSCCs(ruleGraph);
        const sortedSCCIndices = sortSCCs(ruleGraph, sccs);
        const cyclicSCCs = new Set();
        sccs.forEach((scc, idx) => { if (scc.length > 1 || (scc.length == 1 && ruleGraph[scc[0]]?.includes(scc[0]))) { cyclicSCCs.add(idx); } });
        const checkSchedule = sortedSCCIndices.flatMap(i => cyclicSCCs.has(i) ? [...sccs[i], ...sccs[i]] : sccs[i]).map(Number).filter(x => x < nCoolerTypes);
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
        settings.altCalc = $('#altCalc').is(':checked');
        settings.genMult = parsePositiveFloat('Generation Multiplier', $('#genMult').val());
        settings.heatMult = parsePositiveFloat('Heat Multiplier', $('#heatMult').val());
        settings.modFEMult = parsePositiveFloat('Moderator FE Multiplier', $('#modFEMult').val());
        settings.modHeatMult = parsePositiveFloat('Moderator Heat Multiplier', $('#modHeatMult').val());
        settings.FEGenMult = parsePositiveFloat('FE Generation Multiplier', $('#FEGenMult').val());
        settings.activeHeatsinkPrime = $('#activeHeatsinkPrime').is(':checked');
        $.each(rates, (i, x) => { settings.setRate(i, parsePositiveFloat('Cooling Rate', x.val())); });
        $.each(limits, (i, x) => {
          x = parseInt(x.val());
          settings.setLimit(i, x >= 0 ? x : -1);
        });
        settings.clearRules();
        $.each(rules, (idx, rule) => { rule.forEach( (rl, i) => { rl.forEach( r => { settings.setRule(idx, i, r) }); }); });
        settings.clearSchedule();
        $.each(checkSchedule, (i, x) => { settings.setSchedule(i, x); });
        settings.setSchedule(checkSchedule.length, -1);
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
