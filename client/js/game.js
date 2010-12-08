var have_units_placed = false;

function startGame(map, army, player_number)
{
    sessionStorage.player_number = player_number;
    sessionStorage.turn = 0;
    drawMap(map, player_number);
    sendRequest({ cmd: 'getArmy', armyName: army },
       function (json) {
           var units = json.units;
           showUnits(units);
       });
};

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

/* Loops as far, until we receive new turn information */
function loop()
{
    sendNonAuthorizedRequest({ cmd: 'getGameState', name: sessionStorage.gameName }, function(json) {
        if(sessionStorage.turn != json.turnNumber)
        {
            $('#end-placing-btn').hide().button('enable').button('option', 'label', 'End placing');
            $('#end-turn-btn').show();
            $('.unit').remove();
            if(!(sessionStorage.username in json.players))
            {
                alert('You failed');
                return;
            }
            players = json.players;
            $.each(json.players, function(player, pval)
            {
                $.each(pval.units, function(i, unit)
                {
                    var x = unit.X;
                    var y = unit.Y;
                    var nunit = staticUnit({ 'name': unit.name, 'HP': unit.HP, 'cell': map[y][x], 'player': player });
                    map[y][x].append(nunit);
                });
            });
        }
        else
        {
            setTimeout(loop, 3000);
        }
    },
    function(msg, status) {
        if(status == 'badTurn') // placing in progress
        {
            setTimeout(loop, 3000);
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
        /* probably ask about do the player wanna continue, if there are
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
        $('.cell').not('.stone').removeClass().addClass('cell point');
        // and now start a waiting loop
        loop();
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

