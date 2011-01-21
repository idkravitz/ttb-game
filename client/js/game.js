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

function startGame(map, army, player_number)
{
  grid = generateGrid(map);

  grabFactionInfo();

  var is_aborted = 'turn' in sessionStorage && sessionStorage.turn != 0;
  sessionStorage.turn = 0;
  sessionStorage.player_number = player_number;
  if(!is_aborted)
  {
    drawMap(map, player_number);
    sendRequest({ cmd: 'getArmy', armyName: army },
       function (json) {
         var units = json.units;
         showUnits(units);
       });
  }
  else
  {
    waitNextTurn();
  }
};

function generateGrid(map)
{
  result = new Array(map.length);
  $.each(result, function(i)
  {
    result[i] = new Array(map[0].length);
    $.each(result[i], function(j)
    {
      result[i][j] = map[i][j] == 'x';
    });
  });
  return result;
}

/*
 * Obtains info for each unit in fraction, attributes of units:
 *
 * 'name': str,
 * 'HP': int,
 * 'attack': int,
 * 'defence': int,
 * 'range': int,
 * 'damage': int,
 * 'MP': int,
 * 'protection': int,
 * 'initiative': int,
 * 'cost': int,
*/
function grabFactionInfo() // grab from currentGame info in sessionStorage
{
  sendRequest({cmd: 'getFaction', factionName: sessionStorage.factionName }, function(json)
  {
    units_info = {};
    $.each(json.unitList, function(i, unit)
    {
      units_info[unit.name] = unit;
    });
  });
}

function drawMap(mapJson, player_number)
{
  map = new Array(mapJson.length);
  var mapDiv = $('#fullMap');
  var table = $('<table>');
  for (var i = 0; i < mapJson.length; i++)
  {
    map[i] = new Array(mapJson[i].length);
    var row = $('<tr>');
    for (var j = 0; j < mapJson[i].length; j++)
    {
      map[i][j] = $('<div>').addClass(getClassDiv(mapJson[i][j]))
        .data({'x': j, 'y': i});
      $('#player-color').html(showHelp(player_number));
      if (map[i][j].hasClass('player-' + player_number))
      {
        map[i][j].droppable({
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
      row.append($('<td>').append(map[i][j]));
    }
    table.append(row);
  }
  mapDiv.append(table);
  centeringMap(mapDiv);
  return map;
};

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

function showHelp(player_number)
{
  var player_color = ['red', 'blue'];
  return 'Place units on ' + player_color[player_number - 1] + ' cells';
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

function showUnits(unitsGame)
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

/* Loops  until we receive new turn information */
function waitNextTurn()
{
  sendNonAuthorizedRequest({ cmd: 'getGameState', name: sessionStorage.gameName }, function(json) {
    if(sessionStorage.turn != json.turnNumber)
    {
      $('#end-placing-btn').hide().button('enable').button('option', 'label', 'End placing');
      $('#end-turn-btn').show().button('enable').button('option', 'label', 'End turn');

      $('.cell').not('.stone').removeClass().addClass('cell point');
      $('.unit').remove();
      $('#fullMap > *').remove();
      sessionStorage.turn = json.turnNumber;
      delete selection;
      if(!(sessionStorage.username in json.players))
      {
        if(json.players_count)
        {
          alert('You failed');
        }
        else
        {
          alert('Draw');
        }
      }
      else if(json.players_count == 1 && sessionStorage.username in json.players)
      {
        alert('You win!');
      }
      if(typeof(canvas) !== undefined)
      {
        canvas = Raphael($('#fullMap').get(0), 48 * grid[0].length + 2, 48 * grid.length + 2);
      }
      else
      {
        canvas.clear();
      }
      map = new Array(grid.length);
      for(i = 0; i < grid.length; ++i)
      {
        map[i] = new Array(grid[i].length);
        for(j = 0; j < grid[i].length; ++j)
        {
          var pos = getPos(j, i);
          var r = canvas.rect(pos.x, pos.y, 46, 46, 1);
          r.attr({fill: (grid[i][j] ? 'grey': 'green')});
          $(r.node).data({x: j, y: i});
          map[i][j] = r;
        }
      }
      players = json.players;
      your_units = canvas.set();
      enemies_units = canvas.set();
      placings = {};
      $.each(json.players, function(player, pval)
      {
        var is_your = player == sessionStorage.username;
        $.each(pval.units, function(i, unit)
        {
          var x = unit.X;
          var y = unit.Y;
          var pos = getPos(x, y);
          var un = canvas.image(getPictUnit(unit.name), pos.x + 2, pos.y + 2, 42, 42);
          $(un.node).data({
            'name': unit.name,
            'HP': unit.HP,
            'path': 0,
            'distance': 0,
            'player': player,
            'posX': x,
            'posY': y,
            'destX': x,
            'destY': y,
            'attackX': -1,
            'attackY': -1 });
          placings[[x, y]] = un;
          map[y][x].attr({fill: players_colors[pval.player_number - 1]});
          (is_your ? your_units: enemies_units).push(un);
        });
      });
      /*
       * left btndown  -- select/attack
       * right btndown -- move
      */
      var yours = $.map(your_units.items, function(i) { return i.node });
      var enemies = $.map(enemies_units.items, function(i) { return i.node });
      $(yours).mousedown(function(e){
        if(e.which == 1) // Left
        {
          if(typeof selection != 'undefined')
          {
            getSelectedCell().attr({fill: players_colors[sessionStorage.player_number - 1]});
          }
          selection = $(this);
          getSelectedCell().attr({fill: selection_color});
          fillInfo(selection);
        }
        else
        {
          var cell = $(map[$(this).data('posY')][$(this).data('posX')].node);
          e.currentTarget = cell.get(0);
          cell.trigger(e);
        }
      });
      $(yours).hover(function(e){
        if($(this).data('path'))
          $(this).data('path').attr({'stroke': a_yellow }).toFront();
        if('attackLine' in $(this).data())
          $(this).data('attackLine').attr({'stroke': a_yellow }).toFront();
      }, function(e){
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
            var x0 = selection.data('posX'), y0 = selection.data('posY');
            var x1 = $(this).data('x'), y1 = $(this).data('y');
            path = AStar(grid, [x0, y0], [x1, y1]);
            if(path.length && units_info[selection.data('name')].MP >= path.length)
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
              if(selection.data('path'))
                selection.data('path').remove();
              selection.data({ 'destX': x1, 'destY': y1, 'path': line, 'distance': path.length });
              fillInfo(selection);
            }
          }
        }
      });
      $(enemies).unbind('mousedown').mousedown(function(e)
      { // this == enemy, selection == your
        if(typeof selection != 'undefined')
        {
          if(e.which == 1) // Left
          {
            var x0 = selection.data('posX'), y0 = selection.data('posY');
            var x1 = $(this).data('posX'), y1 = $(this).data('posY');
            var pathstring = 'M' + getRelativeCenter([x0, y0]).join(' ')
              + 'L' + getRelativeCenter([x1, y1]).join(' ');
            var line = canvas.path(pathstring).attr({
              stroke: a_red,
              'stroke-dasharray': '-',
              'stroke-width': 2});
            if('attackLine' in selection.data())
            {
              selection.data('attackLine').remove();
            }
            selection.data({ 'attackX': x1, 'attackY': y1, 'attackLine': line});
            fillInfo(selection);
          }
          else
          {
            var cell = $(map[$(this).data('posY')][$(this).data('posX')].node);
            e.currentTarget = cell.get(0);
            cell.trigger(e);
          }
        }
      });
      centeringMap($('#fullMap'));
    }
    else
    {
      setTimeout(waitNextTurn, 3000);
    }
  },
  function(msg, status) {
    if(status == 'badTurn') // placing in progress
    {
      setTimeout(waitNextTurn, 3000);
    }
    else
    {
      alert(msg);
    }
  });
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
  var unit_info = units_info[obj.data('name')];
  addRow('Name', obj.data('name'));
  addRow('Pos', '(' + obj.data('posX') + ',' + obj.data('posY') + ')');
  addRow('HP', obj.data('HP') + '/' + unit_info.HP);
  addRow('MP', (unit_info.MP - obj.data('distance')) + '/' + unit_info.MP);
  addRow('Attack', (obj.data('attackX') == -1) ? 'nothing' : ('(' + obj.data('attackX') + ',' + obj.data('attackY') + ')'));
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
    $('.unit').not('.cell .unit').remove();
    units = $('.unit').map(function(i, v) {
        var data = $(v).data();
        var cdata = $(v).parent().data();
        return { 'name': data.name, 'posX': cdata.x, 'posY': cdata.y };
      });
    sendRequest({ cmd: 'placeUnits', 'units': $.makeArray(units) }, waitNextTurn);
  }
  return false;
}

function getSelectedCell()
{
  return map[window.selection.data('posY')][window.selection.data('posX')];
}

function endTurn()
{
  if(!$(this).button('option', 'disabled'))
  {
    $(this).button('option', 'label', 'waiting for players');
    $(this).button('disable');
    $('#info').empty();
    if(typeof selection != 'undefined')
      getSelectedCell().attr({fill: players_colors[sessionStorage.player_number - 1]});
    units = $.map(your_units, function(v) {
      var data = $(v.node).data();
      return {
        'posX': data.posX,
        'posY': data.posY,
        'destX': data.destX,
        'destY': data.destY,
        'attackX': data.attackX,
        'attackY': data.attackY
      }
    });
    sendRequest({ cmd: 'move', turn: parseInt(sessionStorage.turn), units: $.makeArray(units) }, waitNextTurn);
  }
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

