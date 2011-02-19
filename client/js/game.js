
var have_units_placed = false;
const players_colors = [
  "#ff1717",
  "#0042ff",
  "#1ce6b9",
  "#540081",
  "#fffc01",
  "#fe8a0e",
  "#959697",
  "#e55bb0",
  "#7ebff1",
];
const a_yellow = 'rgba(100%, 100%, 0%, 75%)';
const a_white = 'rgba(100%, 100%, 100%, 50%)';
const a_red = 'rgba(100%, 0%, 0%, 50%)';
const selection_color = 'rgb(100%, 100%, 0%)';

const PLAYER_STATUS_NORMAL = 0;
const PLAYER_STATUS_WIN = 1;
const PLAYER_STATUS_LOSE = 2;
const PLAYER_STATUS_DRAW = 3;

function startGame(map, army, player_number)
{
  player = new Player(map, player_number, army, Viewer);
};

Player = $.inherit(
  {
    __constructor: function(map, player_number, army_name, Viewer)
    {
      this.map = map;
      this.viewer = new Viewer(this);
      this.player_number = player_number;
      this.army_name = army_name;
      this.placings = {};
      this.status = PLAYER_STATUS_NORMAL;
 
      var is_aborted = ('turn' in sessionStorage && sessionStorage.turn != 0);
      sessionStorage.turn = 0;
      //sessionStorage.player_number = player_number;
      this.grid = this._generate_grid();
      this._grabFactionInfo();
      if(!is_aborted)
      {
        this.viewer.drawInitialMap(this.map);
        this._requestArmy();
      }
      else
      {
        this.waitNextTurn();
      }
    },

    _generate_grid: function()
    {
      var map = this.map;
      grid = new Array(map.length);
      $.each(grid, function(i)
      {
        grid[i] = new Array(map[0].length);
        $.each(grid[i], function(j)
        {
          grid[i][j] = (map[i][j] == 'x');
        });
      });
      return grid;
    },

    _requestArmy: function()
    {
      sendRequest({ cmd: 'getArmy', armyName: this.army_name }, function (json)
      {
        var units = json.units;
        player.viewer.showUnits(units);
      });
    },

    _grabFactionInfo: function()
    {
      sendRequest({cmd: 'getFaction', factionName: sessionStorage.factionName }, function(json)
      {
        units_info = {};
        $.each(json.unitList, function(i, unit)
        {
          units_info[unit.name] = unit;
        });
      });
    },

    endPlacing: function()
    {
      this.viewer.endPlacing();
      var units = [];
      pipa = this.placings;
      for(var pos in this.placings)
      {
        pos = pos.split(',');
        units.push({'name': this.placings[pos], 'posX': parseInt(pos[0]), 'posY': parseInt(pos[1])});
      }
      sendRequest({ cmd: 'placeUnits', 'units': units }, $.proxy(this.waitNextTurn, this));
    },

    endTurn: function(feedback)
    {
      this.viewer.endTurn();
      var units = []
      for (var pos in this.placings) if (this.placings[pos].player == sessionStorage.username)
      {
        pos = pos.split(',');
        units.push({
          'posX': parseInt(pos[0]),
          'posY': parseInt(pos[1]),
          'destX': parseInt(this.placings[pos].destX),
          'destY': parseInt(this.placings[pos].destY),
          'attackX': parseInt(this.placings[pos].attackX),
          'attackY': parseInt(this.placings[pos].attackY)
        });
      }
      sendRequest({ cmd: 'move', turn: parseInt(sessionStorage.turn), units: units },
                  function() { player.waitNextTurn(feedback); });
    },

    placeUnit: function(unit, x, y)
    {
      this.placings[[x, y]] = unit;
    },

    move: function(from, to)
    {
      var path = AStar(this.grid, from, to);
      // path includes start point too
      if(path.length && units_info[this.placings[from]['name']].MP >= (path.length - 1))
      {
        this.placings[from]['destX'] = to[0];
        this.placings[from]['destY'] = to[1];
        this.placings[from]['distance'] = path.length - 1;
        this.viewer.drawMove(path);
        return path;
      }
      else
      {
        return [];
      }
    },

    attack: function(from, to)
    {
      this.placings[from]['attackX'] = to[0];
      this.placings[from]['attackY'] = to[1];
      this.viewer.drawAttack(from, to);
    },
    fail: function()
    {
      this.status = PLAYER_STATUS_LOSE;
      this.viewer.fail();
    },
    win: function()
    {
      this.status = PLAYER_STATUS_WIN;
      this.viewer.win();
    },
    draw: function()
    {
      this.status = PLAYER_STATUS_DRAW;
      this.viewer.draw();
    },

    waitNextTurn: function(feedback)
    {
      sendNonAuthorizedRequest({ cmd: 'getGameState', name: sessionStorage.gameName }, function(json) {
        if(sessionStorage.turn != json.turnNumber)
        {
          sessionStorage.turn = json.turnNumber;
          player.json = json;
          
          if(!(sessionStorage.username in json.players))
          {
            if(json.players_count)
            {
              player.fail()
            }
            else
            {
              player.draw();
            }
          }
          else if(json.players_count == 1)
          {
            player.win();
          }

          player.placings = {};

          $.each(json.players, function(p, pval)
          {
            $.each(pval.units, function(i, unit)
            {
              var x = unit.X;
              var y = unit.Y;
              player.placings[[x, y]] = {
                'name': unit.name,
                'HP': unit.HP,
                'path': 0,
                'distance': 0,
                'player': p,
                'posX': x,
                'posY': y,
                'destX': x,
                'destY': y,
                'attackX': -1,
                'attackY': -1 };
            });
          });

          player.viewer.nextTurnStarted(json, player.grid);
          if(feedback)
          {
            feedback();
          }
        }
        else
        {
          setTimeout(function() { waitNextTurn(feedback); }, 3000);
        }
      },
      function(msg, status) 
      {
        if(status == 'badTurn') // placing in progress
        {
          setTimeout(function() { waitNextTurn(feedback); }, 3000);
        }
        else
        {
          alert(msg);
        }
      });
    }
  }
);

Viewer = $.inherit(
  {
    __constructor: function(player)
    {
      this.player = player;
    },
    drawInitialMap: function(map, player_number)
    {
      var mapDiv = $('#fullMap');
      var table = $('<table>');
      for (var i = 0; i < map.length; i++)
      {
        var row = $('<tr>');
        for (var j = 0; j < map[i].length; j++)
        {
          var cell  = $('<div>').addClass(getClassDiv(map[i][j]))
            .data({'x': j, 'y': i});
          $('#player-color').html(showHelp(this.player.player_number, true));
          if (cell.hasClass('player-' + this.player.player_number))
          {
            cell.droppable({
              accept: '.unit',
              scope: 'free',
              drop: function(event, ui)
              {
                var dropped = ui.draggable;
                have_units_placed = true;
                $('#end-placing-btn').button('enable');
                $(this).setDroppableScope('default');
                detachFromCell(dropped);
                $(dropped).appendTo(this);
                clearUnitStyle(dropped);
              }
            });
          }
          row.append($('<td>').append(cell));
        }
        table.append(row);
      }
      mapDiv.append(table);
      centeringMap(mapDiv);
    },
    showUnits: function(unitsGame)
    {
      $('#control-panel').droppable({
        accept: '.unit',
        scope: 'free',
        drop: function(event, ui) {
          detachFromCell(ui.draggable);
          have_units_placed = have_units_placed && ($('.cell .unit').length != 0);
          $('#end-placing-btn').button('option', 'disabled', !have_units_placed);
        }
      });
      for(var i = 0; i < unitsGame.length; i++){
        for(var j = 0; j < unitsGame[i].count; j++){
          var unit = newUnit(unitsGame[i].name);
          $('#control-panel').append(unit);
        }
      }
    },
    win: function()
    {
      alert('You win');
    },
    fail: function()
    {
      alert('You lose');
    },
    draw: function()
    {
      alert('Draw');
    },
    drawMove: function(path)
    {
      if(path.length)
      {
        pathstring = "M" + getRelativeCenter(path[0]);
        var i = 1;
        for(; i < path.length - 2; i += 3)
        {
          var pair1 = getRelativeCenter(path[i]);
          var pair2 = getRelativeCenter(path[i + 1]);
          var pair3 = getRelativeCenter(path[i + 2]);
          pathstring += "C" + pair1.concat(pair2).concat(pair3).join(" ");
        }
        if(i < path.length)
        {
          var points = [];
          for(j = 0; j < 3; ++j, ++i)
          {
            var point = getRelativeCenter(path[i < path.length ? i: (path.length - 1)]);
            points.push(point[0], point[1]);
          }
          pathstring += "C" + points.join(" ");
        }
        var line = canvas.path(pathstring);
        line.attr({
          'stroke-width': 3,
          'stroke': a_white,
          'stroke-dasharray': '-'});
        var unit = $(this.placings[path[0]].node);
        if(unit.data('path'))
          unit.data('path').remove();
        unit.data({'path': line});
        fillInfo(unit);
      }
    },
    drawAttack: function(from, to)
    {
      var pathstring = 'M' + getRelativeCenter(from).join(' ')
        + 'L' + getRelativeCenter(to).join(' ');
      var line = canvas.path(pathstring).attr({
        'stroke': a_red,
        'stroke-dasharray': '-',
        'stroke-width': 2});
      var unit = $(this.placings[from].node);
      if('attackLine' in unit.data())
      {
        unit.data('attackLine').remove();
      }
      unit.data({'attackLine': line});
      fillInfo(unit);
    },
    nextTurnStarted: function(json, grid)
    {
      $('#end-placing-btn').hide().button('enable').button('option', 'label', 'End placing');
      $('#end-turn-btn').show().button('enable').button('option', 'label', 'End turn');
      $('#start-ai').button('enable');
      $('#stop-ai').button('enable');
      $('.cell').not('.stone').removeClass().addClass('cell point');
      $('.unit').remove();
      $('#fullMap > *').remove();
      $('#player-color').html(showHelp(this.player.player_number, false));
      delete selection;
      if(typeof(canvas) !== undefined)
      {
        canvas = Raphael($('#fullMap').get(0), 48 * grid[0].length + 2, 48 * grid.length + 2);
      }
      else
      {
        canvas.clear();
      }
      this.map = new Array(grid.length);
      var viewer = this.player.viewer;
      for(i = 0; i < grid.length; ++i)
      {
        this.map[i] = new Array(grid[i].length);
        for(j = 0; j < grid[i].length; ++j)
        {
          var pos = getPos(j, i);
          var r = canvas.rect(pos.x, pos.y, 46, 46, 1);
          r.attr({fill: (grid[i][j] ? 'grey': 'green')});
          $(r.node).data({x: j, y: i});
          this.map[i][j] = r;
        }
      }
      var players = json.players;
      var your_units = canvas.set();
      var enemies_units = canvas.set();
      this.placings = {};
      $.each(players, function(player, pval)
      {
        var is_your = (player == sessionStorage.username);
        $.each(pval.units, function(i, unit)
        {
          var x = unit.X;
          var y = unit.Y;
          var pos = getPos(x, y);
          var un = canvas.image(getPictUnit(unit.name), pos.x + 2, pos.y + 2, 42, 42);
          $(un.node).data({'pos': [x,y]});
          viewer.placings[[x, y]] = un;
          viewer.map[y][x].attr({fill: players_colors[pval.player_number - 1]});
          (is_your ? your_units: enemies_units).push(un);
        });
      });
      /*
       * left btndown  -- select/attack
       * right btndown -- move
       */
      var yours = $.map(your_units.items, function(i) { return i.node });
      var enemies = $.map(enemies_units.items, function(i) { return i.node });
      
      $(yours).mousedown(function(e)
      {
        if(e.which == 1) // Left -- selection
        {
          if(typeof selection != 'undefined')
          {
            viewer.getSelectedCell().attr({fill: players_colors[player.player_number - 1]});
          }
          selection = $(this);
          viewer.getSelectedCell().attr({fill: selection_color});
          fillInfo(selection);
        }
        else
        {
          var cell = $(viewer.map[$(this).data('pos')[1]][$(this).data('pos')[0]].node);
          e.currentTarget = cell.get(0);
          cell.trigger(e);
        }
      });
      $(yours).hover(function(e)
      {
        if($(this).data('path'))
          $(this).data('path').attr({'stroke': a_yellow }).toFront();
        if('attackLine' in $(this).data())
          $(this).data('attackLine').attr({'stroke': a_yellow }).toFront();
      }, function(e)
      {
        if($(this).data('path'))
          $(this).data('path').attr({'stroke': a_white });
        if('attackLine' in $(this).data())
          $(this).data('attackLine').attr({'stroke': a_red });
      });
      
      $('svg').unbind('contextmenu').bind('contextmenu', false); // disable context menu
      
      $('svg rect').unbind('mousedown').mousedown(function(e)
      {
        if(typeof selection != 'undefined')
        {
          if(e.which == 3) // right
          {
            var from = selection.data('pos');
            var to = [$(this).data('x'), y1 = $(this).data('y')];
            var path = player.move(from, to);
          }
        }
      });
      $(enemies).unbind('mousedown').mousedown(function(e)
      { // this == enemy, selection == your
        if(typeof selection != 'undefined')
        {
          if(e.which == 1) // Left
          {
            var from = selection.data('pos');
            var to = $(this).data('pos');
            player.attack(from, to);
          }
          else
          {
            var cell = $(viewer.map[$(this).data('pos')[1]][$(this).data('pos')[0]].node);
            e.currentTarget = cell.get(0);
            cell.trigger(e);
          }
        }
      });
      centeringMap($('#fullMap'));
    },
    endPlacing: function()
    {
      $('.unit').not('.cell .unit').remove();
      $('.unit').each(function(i, v) {
        var data = $(v).data();
        var cdata = $(v).parent().data();
        player.placeUnit(data.name, cdata.x, cdata.y);
      });
    },
    endTurn: function()
    {
      if(!$('#end-turn-btn').button('option', 'disabled'))
      {
        $('#end-turn-btn').button('option', 'label', 'waiting for players');
        $('#end-turn-btn').button('disable');
        $('#start-ai').button('disable');
        $('#stop-ai').button('disable');
      }
      $('#info').empty();
      if(typeof selection != 'undefined')
        this.getSelectedCell().attr({fill: players_colors[this.player.player_number - 1]});
    },

    getSelectedCell: function()
    {
      return this.map[window.selection.data('pos')[1]][window.selection.data('pos')[0]];
    }
  }
);

function waitNextTurn(feedback)
{
  player.waitNextTurn(feedback);
}

function centeringMap(obj)
{
  $(obj).position({
    my: 'center center',
    at: 'center center',
    of: $(obj).parent()});
  $(obj).css('left', Math.max(parseInt($(obj).css('left')), 0));
  $(obj).css('top', Math.max(parseInt($(obj).css('top')), 0));
}

function getClassDiv(charMap)
{
  var common_class;
  if ((charMap >= '1') && (charMap <= '9')) common_class = 'player-' + charMap;
  if (charMap == '.') common_class = 'point';
  if (charMap == 'x') common_class = 'stone';
  return common_class + ' cell'
}

function showHelp(player_number, is_placing_turn)
{
  var block = '<div style="display:inline-block;height:32px;width:32px;'
    + 'background-image:url(images/mapcolors/color' + (player_number + 2) + '.png)"/>';
  return (is_placing_turn ? 'Place units on ': 'Your units are ') + block;
}

function getRawName(name)
{
  return name.toLowerCase().replace(" ", "_");
}

function getPictUnit(name)
{
  var faction = getRawName(sessionStorage.factionName);
  var name = getRawName(name);
  return 'images/units/' + faction + '/' + name + '.png';
}


function getCssPictUnit(name)
{
  return 'url(' + getPictUnit(name) + ')'; 
}

function clearUnitStyle(unit)
{
  var img = $(unit).css('background-image');
  $(unit).removeAttr('style');
  $(unit).css('background-image', img).css('position', 'relative');
}


function staticUnit(data)
{
  var unit = $('<div>').addClass('unit');
  unit.css('background-image', getCssPictUnit(data.name));
  unit.data(data);
  unit.dblclick(function() {
    $('#about-fact').show();
  });
  return unit;
}

function newUnit(unitName)
{
  var unit = staticUnit({'name': unitName});
  unit.draggable({
    revert: 'invalid',
    scope: 'free'
  });
  return unit;
}

function detachFromCell(obj)
{
  if($(obj).parent().hasClass('cell'))
  {
    $(obj).parent().setDroppableScope('free');
    $(obj).appendTo($('#control-panel'));
    clearUnitStyle(obj);
  }
}

function getPos(x, y)
{
  return {x: x * 48 + 2, y: y * 48 + 2};
}


function getRelativeCenter(pair)
{
  var pos = getPos(pair[0], pair[1]);
  x = pos.x + (44 / 2);
  y = pos.y + (44 / 2);
  return [x,y];
}

function fillInfo(obj)
{
  function addRow(name, value)
  {
    $('#info').append($('<tr/>').append($('<td/>').text(name)).append($('<td/>').text(value)));
  }
  $('#info').empty();
  var pos = obj.data('pos');
  var params = player.placings[pos];
  var unit_info = units_info[params['name']];

  addRow('Name', params['name']);
  addRow('Pos', '(' + pos[0] + ',' + pos[1] + ')');
  addRow('HP', params['HP'] + '/' + unit_info.HP);
  addRow('MP', (unit_info.MP - params['distance']) + '/' + unit_info.MP);
  addRow('Attack', (params['attackX'] == -1) ? 'nothing' : ('(' + params['attackX'] + ',' + params['attackY'] + ')'));
  addRow('Range', unit_info.range);
  addRow('Defence', unit_info.defence);
  addRow('Damage', unit_info.damage);
  addRow('Protection', unit_info.protection);
  //addRow('Initiative', unit_info.initiative);
}

/* Handler for #end-placing-btn */
function endPlacing()
{
  if(!$(this).button('option', 'disabled'))
  {
    /* probably ask about if the player wanna continue, when there are
     * any empty cells for placing and free units */
    $(this).button('option', 'label', 'waiting for players');
    $(this).button('disable');
    player.endPlacing();
  }
  return false;
}



function endTurn()
{
  player.endTurn();
  return false;
}

/*
* Fix for bug with droppable scope,
* source: http://stackoverflow.com/questions/3097332/jquery-drag-droppable-scope-issue
*/
jQuery.fn.extend({
  setDroppableScope: function(scope) {
    return this.each(function() {
      var currentScope = $(this).droppable('option','scope');
      if (typeof currentScope == 'object' && currentScope[0] == this) return true; //continue if this is not droppable

      //Remove from current scope and add to new scope
      var i, droppableArrayObject;
      for(i = 0; i < $.ui.ddmanager.droppables[currentScope].length; i++) {
        var ui_element = $.ui.ddmanager.droppables[currentScope][i].element[0];

        if (this == ui_element) {
          //Remove from old scope position in jQuery's internal array
          droppableArrayObject = $.ui.ddmanager.droppables[currentScope].splice(i,1)[0];
          //Add to new scope
          $.ui.ddmanager.droppables[scope] = $.ui.ddmanager.droppables[scope] || [];
          $.ui.ddmanager.droppables[scope].push(droppableArrayObject);
          //Update the original way via jQuery
          $(this).droppable('option','scope',scope);
          break;
        }
      }
    });
  }
});
