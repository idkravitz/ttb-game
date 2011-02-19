var fillDropdownWithNumbers = function(opts) {
  var $dropdown = opts.dropdown;
  for (var i = opts.lowerBound; i <= opts.upperBound; i++) {
    $dropdown.append($('<option>').append(i));
  }
};

function chooseMap()
{
  var select = $('#select-edit-map');
  $('#choose-map-fields').hide();
  $('#create-map-button').show();
  $('#create-map-fields').show();
  if(select.val() != 'new') {
    sendRequest({ cmd: 'getMap', name: $(':selected', select).text() },
      function (json) {
        var map = json.map;
        mapEditor.$height.val(map.length);
        mapEditor.$width.val(map[0].length);
        $('#map-editor input[type="text"]').val($(':selected', select).text());
        mapEditor.drawMap(map);
        mapEditor.drawColorsMenu();
      });
  }
}

var MapEditor = function(opts) {
  this.$container = opts.container;
  this.$map = opts.map;
  this.$width = opts.widthSelect;
  this.$height = opts.heightSelect;
  this.$players = opts.playersSelect;
  this.$colorsMenu = opts.colorsMenu;
  this.$saveControls = opts.saveControls;

  this.cells = {
    'free': ['#6c0', '.'],
    'occupied': ['#666', 'x'],
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
};


MapEditor.prototype.draw = function() {
  this.drawMap();
  this.drawColorsMenu();
};

MapEditor.prototype.getCellType = function(cell)
{
  if(cell == '.')
    return 'free';
  if(cell == 'x')
    return 'occupied';
  return 'player ' + cell;
};

MapEditor.prototype.drawMap = function(map) {
  this.$map.children().remove();

  var mapEditor = this,
    $table = $('<table>').attr('id', 'map-table');

  for (var i = 0; i < this.$height.val(); i++) {
    var $row = $('<tr>');
    for (var j = 0; j < this.$width.val(); j++) {
      var $cell = $('<td>')
        .css('background-color', !map ? this.cells.free[0]: this.cells[this.getCellType(map[i][j])][0])
        .click(function() {
          var name = mapEditor.$selected.data('name');
          $(this).css('background-color', mapEditor.cells[name][0]);
          $(this).data('name', name);
        })
        .addClass('row'+i)
        .data('name', !map ? 'free': this.getCellType(map[i][j]));
      $row.append($cell);
    }
    $table.append($row);
  }
  this.$map.append($table);
  this.$saveControls.css('display', 'block');
};


MapEditor.prototype.drawColorsMenu = function() {
  this.$colorsMenu.children().remove();
  this.$selected = null;

  var mapEditor = this,

  generateName = function(index) {
    var names = {1: 'free', 2: 'occupied'};
    return index <= 2 ? names[index] : 'player '+(index-2);
  },

  updateIcon = function($cell, isDown) {
    var css = {
      'background-image': $cell.data('down'),
      'background-color': 'black'
    };

    if (!isDown) {
      css = {
        'background-image': $cell.data('normal'),
        'background-color': 'white'
      };
    }

    $cell.css(css);
  },

  players = parseInt(this.$players.val(), 10) + 2,
  $table = $('<table>').css('height', players * 36 +'px');

  for (var i = 1; i <= players; i++) {
    var name = generateName(i);
    var $nameCell = $('<td>').addClass('name-cell').append(name);

    var normal = 'url(images/mapcolors/color' + i + '.png)';
    var $colorCell = $('<td>')
      .attr('class', 'color-cell')
      .css('background-image', normal)
      .data({
        'normal': normal,
        'down': 'url(images/mapcolors/color' + i + 'down.png)',
        'name': name
      })
      .click(function() {
        updateIcon(mapEditor.$selected, false);
        mapEditor.$selected = $(this);
        updateIcon(mapEditor.$selected, true);
      });

    if (this.$selected === null) {
      this.$selected = $colorCell;
      updateIcon($colorCell, true);
    }
    $table.append($('<tr>').append($nameCell).append($colorCell));
  }

  this.$colorsMenu.append($table);
};

function uploadMap(name, map)
{
  sendRequest({ cmd: "uploadMap", name: name, terrain: map }, function() 
  {
    //send json or create txt file(name,map)
    $('#map-editor input[type="text"]').val('');
    $('#map-editor select').val('2');
    mapEditor.$map.children().remove();
    mapEditor.$colorsMenu.children().remove();
    mapEditor.$saveControls.hide();
    $('#create-map-button').hide();
    $('#create-map-fields').hide();
    $('#choose-map-fields').show();
    sections['map-edit'].show(); 
  });
}

MapEditor.prototype.exportMap = function() {
  var mapEditor = this,
    map = [];
  for (var i = 0; i < this.$height.val(); i++) {
    var row = '';
    $('.row'+i).each(function(index, element) {
      row += mapEditor.cells[$(element).data('name')][1];
    });
    map.push(row);
  }
  var name = $('#map-editor input[type="text"]').val();
  var select = $('#select-edit-map');
  if(select.val() == 'new') {
      uploadMap(name, map);
  }
  else
  {
    sendRequest({cmd: 'deleteMap', name: name}, function() { uploadMap(name, map) });
  }
};


$(function() {
  var elements = {
    container: $('#map-editor'),
    colorsMenu: $('#colors-menu'),
    map: $('#map'),
    widthSelect: $('#width-select'),
    heightSelect: $('#height-select'),
    playersSelect: $('#players-select'),
    saveControls: $('#save-controls')
  };

  fillDropdownWithNumbers({
    dropdown: elements.widthSelect,
    lowerBound: 2,
    upperBound: 30
  });

  fillDropdownWithNumbers({
    dropdown: elements.heightSelect,
    lowerBound: 2,
    upperBound: 30
  });

  fillDropdownWithNumbers({
    dropdown: elements.playersSelect,
    lowerBound: 2,
    upperBound: 9
  });


  mapEditor = new MapEditor(elements);
  $('#create-map-button').click(function() { mapEditor.draw(); });
  $('#save-controls input').click(function() { mapEditor.exportMap(); });
});
