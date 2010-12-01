function startGame(map, army)
{
    map = drawMap(map);
    sendRequest({ cmd: 'getArmy', armyName: army },
       function (json) {
           var unitsGame = json.units;
           showUnits(map, unitsGame);
       });
};

function drawMap(mapJson)
{
    var map = new Array(mapJson.length);
    var mapDiv = $("#fullMap");
    var table = $("<table>");
    for (var i = 0; i < mapJson.length; i++)
    {
        map[i] = new Array(mapJson.length);
        var row = $("<tr>");
        for (var j = 0; j < mapJson.length; j++)
        {
            map[i][j] = $("<div>").addClass(getClassDiv(mapJson[i][j]))
                .data({
                    "x": i,
                    "y": j,
                    "unit": "none",
                    "available": mapJson[i][j] =='1'
                })
                .droppable({
                    accept: ".unit",
                    drop: function(event, ui)
                    {
                        var unit = newUnit(ui.draggable.data("unit"));
                        if (!$(this).data("available")){
                            var x = $(this).data("y");
                            var dx = (x < mapJson.length / 2) ? -(1 + x) * $(this).width(): (mapJson.length - x + 1) * $(this).width();
                            unit.offset({
                                top: ui.draggable.offset().top - $("#field").offset().top,
                                left: $(this).offset().left + dx - $("#field").offset().top
                            });
                            $("#field").append(unit);
                        }
                        else
                        {
                            $(this).data({ "available": false, "unit": ui.draggable.data("unit") });
                            $(this).append(unit);
                        }
                        ui.draggable.remove();
                    }
            });
            row.append($("<td>").append(map[i][j]));
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
    if ((charMap >= "1") && (charMap <= "9")) common_class = "player-" + charMap;
    if (charMap == ".") common_class = "point";
    if (charMap == "x") common_class = "stone";
    return common_class + " cell"
}

function getPictUnit(name)
{
    return 'url(images/person1.bmp)';
}

function showUnits(map, unitsGame)
{
    var x;
    var y = $('#control-panel').offset().top + 40;
    var h = 50;
    var width = $('#control-panel').width()+$('#control-panel').offset().left;
    for(var i = 0; i < unitsGame.length; i++){
        x = $('#control-panel').offset().left;
        for(var j = 0; j < unitsGame[i].count; j++){
            var unit = newUnit(unitsGame[i].name);
            unit.offset({ top: y, left: x });
            $('#control-panel').append(unit);
            x += h;
            if (x > (width - h)){
                x = $('#control-panel').offset().left;
                y += h;
            }
        }
        y += h;
    }
}

function newUnit(unitName)
{
    var unit = $("<div>").addClass("unit");
    unit.css("background-image",getPictUnit(unitName));
    unit.dblclick(function() {
        $('#out-fact').show();
    });
    unit.data({ "unit": unitName }).draggable({
        start: startDrag
    });
    return unit;
}

function startDrag()
{
    var parent = $(this).parent();
    if (parent.hasClass("cell"))
        parent.data({ "available": true, "unit" :"none" });
}
