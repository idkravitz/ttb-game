function startGame(map, army)
{
    sendRequest({ cmd: 'getArmy', armyName: army },
       function (json) {
           var unitsGame = json.units;
           showUnits(unitsGame);
           drawMap(map);
       });
};

function drawMap(mapJson)
{
    var map = new Array(mapJson.length);
    var mapDiv = $('#fullMap');
    var table = $('<table>');
    for (var i = 0; i < mapJson.length; i++)
    {
        map[i] = new Array(mapJson.length);
        var row = $('<tr>');
        for (var j = 0; j < mapJson.length; j++)
        {
            map[i][j] = $('<div>').addClass(getClassDiv(mapJson[i][j]))
            if (map[i][j].hasClass('player-1'))
            {
                map[i][j].droppable({
                    accept: '.unit',
                    scope: 'free',
                    drop: function(event, ui)
                    {
                        var dropped = ui.draggable; 
                        $(this).setDroppableScope('default');
                        freeLeavedCell(dropped);
                        $(dropped).data({'cell': $(this)});
                        $(dropped).position({
                            of: $(this),
                            my: "center center",
                            at: "center center"
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
        }    
    });
    for(var i = 0; i < unitsGame.length; i++){
        for(var j = 0; j < unitsGame[i].count; j++){
            var unit = newUnit(unitsGame[i].name);
            $('#control-panel').append(unit);
        }
    }
}

function newUnit(unitName)
{
    var unit = $('<div>').addClass('unit');
    unit.css('background-image',getPictUnit(unitName));
    unit.dblclick(function() {
        $('#about-fact').show();
    });
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

