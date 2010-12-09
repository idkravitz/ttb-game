var have_units_placed = false;

function startGame(map, army, player_number)
{
    drawMap(map, player_number);
    grid = generateGrid(map);

    grabFactionInfo();

    var is_aborted = 'turn' in sessionStorage && sessionStorage.turn != 0;
    sessionStorage.turn = 0;
    sessionStorage.player_number = player_number;
    if(!is_aborted)
    {
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
        map[i] = new Array(mapJson.length);
        var row = $('<tr>');
        for (var j = 0; j < mapJson.length; j++)
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
                        freeLeavedCell(dropped);
                        $(dropped).data({'cell': $(this)});
                        $(dropped).position({
                            my: 'center center',
                            at: 'center center',
                            of: $(this)
                        });
                    }
                });
            }
            row.append($('<td>').append(map[i][j]));
        }
        table.append(row);
    }
    mapDiv.append(table);
    centerMap(mapDiv);
    return map;
};

function centerMap(mapDiv)
{
    var dw = $('#field').offset().left + ($('#field').width() - mapDiv.width()) / 2;
    var dh = $('#field').offset().top + ($('#field').height() - mapDiv.height()) / 2;
    mapDiv.offset({ top: dh, left: dw });
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

function getPictUnit(name)
{
    return 'url(images/person1.bmp)';
}

function showUnits(unitsGame)
{
    $('#control-panel').droppable({
        accept: '.unit',
        scope: 'free',
        drop: function(event, ui) {
            freeLeavedCell(ui.draggable);
            var len = ($('.player-' + sessionStorage.player_number).filter(function() {
                return $(this).droppable('option', 'scope') == 'default';
            }).length);
            have_units_placed = have_units_placed && (len != 0);
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
    unit.css('background-image', getPictUnit(data.name));
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

function freeLeavedCell(obj)
{
    var data = $(obj).data();
    if('cell' in data)
    {
        data.cell.setDroppableScope('free');
        delete data.cell;
        $(this).data(data);
    }
}

/* Loops  until we receive new turn information */
function waitNextTurn()
{
    sendNonAuthorizedRequest({ cmd: 'getGameState', name: sessionStorage.gameName }, function(json) {
        if(sessionStorage.turn != json.turnNumber)
        {
            $('.cell').not('.stone').removeClass().addClass('cell point');
            $('#end-placing-btn').hide().button('enable').button('option', 'label', 'End placing');
            $('#end-turn-btn').show().button('enable').button('option', 'label', 'End turn');
            $('.unit').remove();
            sessionStorage.turn = json.turnNumber;
            if(!(sessionStorage.username in json.players))
            {
                alert('You failed');
                return;
            }
            players = json.players;
            $.each(json.players, function(player, pval)
            {
                var is_your = player == sessionStorage.username;
                $.each(pval.units, function(i, unit)
                {
                    var x = unit.X;
                    var y = unit.Y;
                    var nunit = staticUnit({ 
                        'name': unit.name,
                        'HP': unit.HP,
                        'player': player,
                        'destX': x,
                        'destY': y,
                        'attackX': -1,
                        'attackY': -1 });
                    if(is_your)
                    {
                        nunit.addClass('your');
                    }
                    map[y][x].append(nunit);
                });
            });
            /*
             * left btndown  -- select/attack
             * right btndown -- move
             */
            $('.unit, .cell').unbind('contextmenu').bind('contextmenu', false); // disable context menu
            $('.your').unbind('mousedown').mousedown(function(e) // click cann't catch right button 
            {
                if(e.which == 1) // Left
                {
                    selection = $(this);
                }
            $('.cell').unbind('mousedown').mousedown(function(e)
            {
                if('selection' in window)
                {
                    if(e.which == 3) // right
                    {
                        var x0 = selection.parent().data('x'), y0 = selection.parent().data('y');
                        var x1 = $(this).data('x'), y1 = $(this).data('y');
                        path = AStar(grid, [x0, y0], [x1, y1]);
                        if(path.length && units_info[selection.data('name')].MP >= path.length)
                        {
                            selection.data({ 'destX': x1, 'destY': y1 });
                        }
                    }
                }
            });
            $('.unit').not('.your').unbind('mousedown').mousedown(function(e)
            { // this == enemy, selection == your
                if('selection' in window)
                {
                    if(e.which == 1) // Left
                    {
                        var x0 = selection.parent().data('x'), y0 = selection.parent().data('y');
                        var x1 = $(this).parent().data('x'), y1 = $(this).parent().data('y');
                        selection.data({ 'attackX': x1, 'attackY': y1 });
                    }
                }
            });
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

/* Handler for #end-placing-btn */
function endPlacing()
{
    if(!$(this).button('option', 'disabled'))
    {
        /* probably ask about if the player wanna continue, when there are
         * any empty cells for placing and free units */
        $(this).button('option', 'label', 'waiting for players');
        $(this).button('disable');
        $('.unit').filter(function() { return !('cell' in $(this).data()); }).remove();
        units = $('.unit').map(function(i, v) {
                var data = $(v).data();
                var cdata = data.cell.data();
                return { 'name': data.name, 'posX': cdata.x, 'posY': cdata.y };
            });
        sendRequest({ cmd: 'placeUnits', 'units': $.makeArray(units) }, $.noop);
        // and now start a waiting loop
        waitNextTurn();
    }
    return false;
}

function endTurn()
{
    if(!$(this).button('option', 'disabled'))
    {
        $(this).button('option', 'label', 'waiting for players');
        $(this).button('disable');
        units = $('.your').map(function(i, unit) {
            var data = $(unit).data();
            return { 
                'posX': $(unit).parent().data('x'),
                'posY': $(unit).parent().data('y'),
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

