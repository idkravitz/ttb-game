function gameInterface(map,army)
{
    map = drawMap(map);
    getJSON(addSid({cmd:"getArmy", armyName: army}),
        function(json){
            unitsGame = json.units;
            alert(unitsGame[0]);
            showUnits(map, unitsGame);
        });
};

function drawMap(map)
{
    var tableMap = document.getElementById("tableMap");
    var row = tableMap.insertRow(0);
    var colorsMap = {
        'x': '#666666',
        '1': '#ff6666',
        '.': '#66cc00',
        '2': '#6666ff'
    };
    for (var i = 0; i < map.length; i++)
    {
        var row = tableMap.insertRow(i);
        var mapStr = [];
        for (var j = 0; j < map.length; j++)
        {
            var cell = row.insertCell(j);
            cell.style.backgroundColor = colorsMap[map[i][j]];
            mapStr.push(map[i][j]);
        }
        map[i] = mapStr;
    }
    var dw = $('#field').offset().left + ($('#field').width() - $('#fullMap').width())/2;
    var dh = $('#field').offset().top + ($('#field').height() - $('#fullMap').height())/2;
    $('#fullMap').offset({top : dh, left : dw});
    return map;
}

function showUnits(map, unitsGame)
{
    /*each unit should have it's picture
    var picUnit = {
        'one': 'images/person1.bmp',
        'two': 'images/person1.bmp',
        'three': 'images/house.bmp'
    };
    */

    var picUnit = ['images/person1.bmp','images/house.bmp','images/person1.bmp'];

    fragment = document.createDocumentFragment();
    div = document.createElement('div');
    div.className ='factDiv';
    pic = document.createElement('img');
    pic.width = 40;
    for(var i = 0; i < unitsGame.length; i++)
    {
        for(var j = 0; j < unitsGame[i].count; j++)
        {
            //pic.src = picUnit[unitsGame[i].count];
            pic.src = picUnit[i];
            div.appendChild(pic);
            var t = div.cloneNode(true);
            t.id = unitsGame[i].name;
            $(t).mousedown(function()
            {
                var fMap = document.getElementById("fullMap");
                var w = document.getElementById("tableMap").rows[0].cells[0];
                var x = Math.round(($(this).position().top - $(fMap).position().top)/$(w).width());
                var y = Math.round(($(this).position().left - $(fMap).position().left)/$(w).width());
                x = changePos(x, map[0].length) -5;
                y = changePos(y, map[0].length) - 5;
                if ((x >= 0) && (x < map[0].length) && (y >= 0) && (y < map[0].length))
                {
                    if (map[x][y] == 'used') map[x][y] = '1';
                }
            });
            fragment.appendChild(t);
        }
    };

    $('#control-panel').append(fragment);

    $('.factDiv').dblclick(function(){
        $('#about-fact').show();
    });

    $('#content').click(function(){
        $('#about-fact').hide();
    });

    var n = map[0].length;

    $('.factDiv').draggable({});
    $('#fullMap').droppable({
        drop: function(event, ui)
        {
            var cell, newCell, x, y, posX, posY
            cell = document.getElementById("tableMap").rows[0].cells[0];
            //number of cell, where we drop the element
            x = Math.round((ui.draggable.offset().top - $(cell).offset().top + 2)/$(cell).width());
            y = Math.round((ui.draggable.offset().left - $(cell).offset().left + 2)/$(cell).width());
            //don't have n cell (n-1 the last)
            x = changePos(x, n);
            y = changePos(y, n);

            newCell = document.getElementById("tableMap").rows[x].cells[y];
      	    posY = $(newCell).offset().top;
		    if(map[x][y] == '1')
		    {
                posX = $(newCell).offset().left;
                //put that smth is in that cell
        		map[x][y] = 'used';
            }
            else
            {
                //put away from field if we cannot place in cells
                if(y > n/2)
                {
                    posX = $(cell).offset().left + (n + 0.5)*$(cell).width();
                }
				else
				{
				    posX = $(cell).offset().left - 1.5*$(cell).width();
				}
			    posY = ui.draggable.offset().top;
            }
            ui.draggable.offset({top:posY+4, left:posX+4});
        }
    });
}

function changePos(pos, len)
{
    if (pos == len) pos--;
    return pos;
}