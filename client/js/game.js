function changeCell(th, map)
{
    var fMap = document.getElementById("fullMap");
    var w = document.getElementById("tableMap").rows[0].cells[0];
    var y = Math.round(($(th).position().top - $(fMap).position().top)/$(w).width());
    var x = Math.round(($(th).position().left - $(fMap).position().left)/$(w).width());
    changePos(x, y, map.length);
    if ((x >= 0) && (x < map.length) && (y >= 0) && (y < map.length))
    {
        if (map[y][x] == 'used') map[y][x] = '1';
    }
};

function drawMap(map)
{
    var n = map.length;
    var tableMap = document.getElementById("tableMap");
    var row = tableMap.insertRow(0);
    var colorsMap = {
        'x': '#666666',
        '1': '#ff6666',
        '.': '#66cc00',
        '2': '#6666ff'
    };
    for (var i = 0; i < n; i++)
    {
        var row = tableMap.insertRow(i);
        for (var j = 0; j < n; j++)
        {
            var cell = row.insertCell(j);
            cell.style.backgroundColor = colorsMap[map[i][j]];
        }
    }

    //put map in div center
    var dw = $('#field').offset().left + ($('#field').width() - $('#fullMap').width())/2;
    var dh = $('#field').offset().top + ($('#field').height() - $('#fullMap').height())/2;
    $('#fullMap').offset({top:dh, left:dw});

    var i = 3;
    fragment = document.createDocumentFragment();
    div = document.createElement('div');
    div.className ='factDiv';
    pic = document.createElement('img');
    pic.src='images/person1.bmp';
    div.appendChild(pic);
    while (i--)
    {
           var t = div.cloneNode(true);
           $(t).mousedown(function(){
               changeCell(this,map);
           });
           fragment.appendChild(t);
    }
    pic.src='images/house.bmp';
    pic.width = 40;
    i = 3;
    while (i--)
    {
           var t = div.cloneNode(true);
           $(t).mousedown(function(){
               changeCell(this,map);
           });
           fragment.appendChild(t);
    }
    $('#control-panel').append(fragment);

    $('.factDiv').dblclick(function(){
        $('#about-fact').show();
    });

    $('#content').click(function(){
        $('#about-fact').hide();
    });

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
            changePos(x, y, n);
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

};

function changePos(posX, posY, length)
{
    if (posX == length) posX--;
    if (posY == length) posY--;
}