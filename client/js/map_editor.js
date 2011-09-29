var gOpts = {
  minMapSize: 2,
  defMapSize: 5,
  maxMapSize: 25,

  minPlayers: 2,
  defPlayers: 2,
  maxPlayers: 9,

  maxCellSize: 30,
  mapCellBorderSize: 1,

  maxColorPanelWidth: 380,
  maxColorCellHeight: 40,  
  colorCellBorderSize: 1,
  selectedColorHeight: 30
}

function chooseMap(mapName, mapPlayers) {
  if (mapName != null) {
    sendRequest({ cmd: 'getMap', name: mapName }, function(json) {
      var
        map = json.map,
        mapWidth = map[0].length,
        mapHeight = map.length;

      mapEditor.currentMap.raw = map;
      mapEditor.currentMap.width = mapWidth;
      mapEditor.currentMap.height = mapHeight;

      mapEditor.$name.val(mapName);
      mapEditor.initMapFields(mapName, mapWidth, mapHeight, mapPlayers);
      mapEditor.drawMap();
      mapEditor.drawColorsMenu();
      showSection('editor-window');
    });
  }
  else {
    mapEditor.initMapFields(
      '',
      gOpts.defMapSize,
      gOpts.defMapSize,
      gOpts.defPlayers
    );
    mapEditor.drawMap();
    showSection('editor-window');
  }
}

var MapEditor = function(opts) {
  this.$map = opts.map;
  this.$name = opts.mapName;
  this.$width = opts.widthSelect;
  this.$height = opts.heightSelect;
  this.$players = opts.playersSelect;
  this.$colorsMenu = opts.colorsMenu;

  this.cells = {
    'free'    : ['#6c0',    '.'],
    'occupied': ['#666',    'x'],
    'player 1': ['#ff1717', '1'],
    'player 2': ['#0042ff', '2'],
    'player 3': ['#1ce6b9', '3'],
    'player 4': ['#540081', '4'],
    'player 5': ['#fffc01', '5'],
    'player 6': ['#fe8a0e', '6'],
    'player 7': ['#959697', '7'],
    'player 8': ['#e55bb0', '8'],
    'player 9': ['#7ebff1', '9']
  };

  this.$selected = null;
  this.currentMap = {};
};

MapEditor.prototype.initMapFields = function(name, width, height, players) {
  this.$name.val(name);
  convertToSlider(this.$width,
    gOpts.minMapSize, gOpts.maxMapSize, 1, width);
  convertToSlider(this.$height,
    gOpts.minMapSize, gOpts.maxMapSize, 1, height);
  convertToSlider(this.$players,
    gOpts.minPlayers, gOpts.maxPlayers, 1, players);
}

MapEditor.prototype.draw = function() {
  this.drawMap();
  this.drawColorsMenu();
};

MapEditor.prototype.getCellType = function(cell) {
  if (cell == '.')
    return 'free';
  if (cell == 'x')
    return 'occupied';
  return 'player ' + cell;
};

MapEditor.prototype.drawMap = function() {
  var
    mapEditor = this,
    map = mapEditor.currentMap.raw || null,
    $table = $('<table>');

  cellExists = function(i, j) {
    return (map &&
        (i < mapEditor.currentMap.height) &&
        (j < mapEditor.currentMap.width));
  };

  getCellColor = function(i, j) {
    return mapEditor.cells[cellType][0];
  };

  getCellName = function(i, j) {
    return cellExists(i, j) ? mapEditor.getCellType(map[i][j]): 'free';
  };

  for (var i = 0; i < this.$height.val(); i++) {
    var $row = $('<tr>');
    for (var j = 0; j < this.$width.val(); j++) {
      var name = getCellName(i, j);
      var $cell = $('<td>')
        .css('background-color', mapEditor.cells[name][0])
        .click(function() {
          $(this).css(
            'background-color',
            mapEditor.$selected.css('background-color'));
          var
            x = $(this).data('x'),
            y = $(this).data('y'),
            name = mapEditor.$selected.attr('name'),
            row = mapEditor.currentMap.raw[y],
            result = '';          
          for (var i = 0; i < row.length; i++) {
            result += (i == x) ? mapEditor.cells[name][1]: row[i];
          }          
          mapEditor.currentMap.raw[y] = result;
          $(this).data('name', name);
        })
        .addClass('row' + i)
        .data({
          'name': name,
          'x': j,
          'y': i
        });
      $row.append($cell);
    }
    $table.append($row);
  }

  var
    widthInCells  = this.$width.val(),
    heightInCells = this.$height.val(),
    borderSizeX = (widthInCells  + 1) * gOpts.mapCellBorderSize,
    borderSizeY = (heightInCells + 1) * gOpts.mapCellBorderSize;

  var cellSize = Math.min(
    gOpts.maxCellSize,
    (gOpts.maxMapBlockWidth  - borderSizeX) / widthInCells,
    (gOpts.maxMapBlockHeight - borderSizeY) / heightInCells
  );

  $table.css('width',  widthInCells  * cellSize + borderSizeX);
  $table.css('height', heightInCells * cellSize + borderSizeY);

  this.$map.children().remove();
  this.$map.append($table);

  mapEditor.saveMap();
  mapEditor.currentMap.width = this.$width.val();
  mapEditor.currentMap.height = this.$height.val();
};

MapEditor.prototype.saveMap = function() {
  var newMap = [];
  for (var i = 0; i < this.$height.val(); i++) {
    var row = '';
    $('.row' + i).each(function(index, element) {
      row += mapEditor.cells[$(element).data('name')][1];
    });
    newMap.push(row);
  }
  mapEditor.currentMap.raw = newMap;  
}

MapEditor.prototype.drawColorsMenu = function() {
  generateName = function(index) {
    var names = {1: 'free', 2: 'occupied'};
    return index <= 2 ? names[index] : 'player ' + (index-2);
  };

  var mapEditor = this;

  var
    cellCount = parseInt(this.$players.val(), 10) + 2,
    cellWidth = (gOpts.maxColorPanelWidth - ((cellCount + 1) *
      gOpts.colorCellBorderSize)) / cellCount,
    cellSize = Math.min(cellWidth, gOpts.maxColorCellHeight);

  var
    $table = $('<table>').css('height', px(cellSize)),
    $row = $('<tr>');

  this.$colorsMenu
    .css('width',  px(cellCount * cellSize))
    .css('height', px(cellSize + gOpts.selectedColorHeight));

  var i = 0;
  $.each(mapEditor.cells, function(name, element) {
    i++;
    if (i <= cellCount) {
      var $cell = $('<td>')
        .addClass(name.replace(' ', '-'))
        .click(function() {
          mapEditor.$selected = $(this);
          $('#editor-selected-color').css(
            'background-color',
            mapEditor.$selected.css('background-color'));
        })
        .attr('name', generateName(i));
      $row.append($cell);
    }
  });
  $table.append($row);

  this.$colorsMenu.children().remove();
  this.$selected = null;
  this.$colorsMenu
    .append($table)
    .append($('<div>').attr('id', 'editor-selected-color'));
  $('.free', $table).click();
};

function uploadMap(name) {
  var mapName = mapEditor.$name.val();
  var map = mapEditor.currentMap.raw;

  sendRequest(
    { cmd: 'uploadMap', name: mapName, terrain: map },
    function(json) { showSection('map-editor'); }
  );
}

MapEditor.prototype.exportMap = function() {
  var mapName = mapEditor.$name.val();

  mapEditor.saveMap();
  mapEditor.draw();

  sendRequest(
    { cmd: 'isMapExists', name: mapName },
    function(json) {
      if (json.exists) {
      // :FIXME: Overwrite?
        sendRequest(
          { cmd: 'deleteMap', name: mapName },
          function() { uploadMap(); }
        );
      }
      else {
        uploadMap();
      }
    }
  );
};

MapEditor.prototype.deleteMap = function() {
  var mapName = mapEditor.$name.val();

  sendRequest(
    { cmd: 'deleteMap', name: mapName },
    function() { showSection('map-editor'); }
  );
  
}

$(function() {
  var elements = {
    map: $('#editor-map'),
    mapName: $('#editor-name'),
    widthSelect: $('#editor-width-select'),
    heightSelect: $('#editor-height-select'),
    playersSelect: $('#editor-players-select'),
    colorsMenu: $('#editor-colors')
  };

  gOpts.maxMapBlockWidth  = parseInt(elements.map.css('width'));
  gOpts.maxMapBlockHeight = parseInt(elements.map.css('height'));

  mapEditor = new MapEditor(elements);
});
