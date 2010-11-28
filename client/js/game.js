function startGame(map,army){
    map = drawMap(map);
    sendRequest({ cmd: 'getArmy', armyName: army },
       function (json){
           unitsGame = json.units;
           showUnits(map, unitsGame);
       });
};

function drawMap(mapJson){
    var map = new Array(mapJson.length);
    var mapDiv = $("#fullMap");
    var table = $("<table>");
    for (var i = 0; i < mapJson.length; i++){
        map[i] = new Array(mapJson.length);
        var row = $("<tr>");
        for (var j = 0; j < mapJson.length; j++){
            map[i][j] = $("<div>").addClass(getClassDiv(mapJson[i][j])).addClass("square");
			map[i][j].data({"x":i,"y":j,"unit" :"none","available":false});
			if (mapJson[i][j] =='1') map[i][j].data({"available":true});
            map[i][j].droppable({
				accept: ".factDiv",
                drop: function(event, ui){
				    if (!$(this).data("available")){
					    var x = $(this).data("y");
				        var dx = (x < mapJson.length/2) ? -(2+x)*$(this).width(): (mapJson.length-x)*$(this).width();
						ui.draggable.offset({left : (event.clientX+dx)});
                    }
					else {
						$(this).append(ui.draggable);
                        $(this).data({"available":false});
                        $(this).data({"unit":ui.draggable.data("unit")});
                        ui.draggable.offset({top : $(this).offset().top+2, left : $(this).offset().left+2});
                    }
                }
            });
            row.append($("<td>").append(map[i][j]));
        }
        table.append(row);
    }
    mapDiv.append(table);
    var dw = $('#field').offset().left + ($('#field').width() - mapDiv.width())/2;
    var dh = $('#field').offset().top + ($('#field').height() - mapDiv.height())/2;
    mapDiv.offset({top : dh, left : dw});
    return map;
};

function getClassDiv(charMap){
    if((charMap > "0") && (charMap < "8")) return "player-"+charMap+" unit";
    if (charMap == ".") return "point unit";
    if (charMap == "x") return "stone unit";
}

function getPictUnit(name){
    return 'url(images/person1.bmp)';
}

function showUnits(map, unitsGame){
    for(var i = 0; i < unitsGame.length; i++){
        for(var j = 0; j < unitsGame[i].count; j++){
           var unit = $("<div>").addClass("factDiv");
			unit.css("background-image",getPictUnit(unitsGame[i].name));
			unit.dblclick(function(){
                $('#out-fact').show();
            });
			unit.data({"unit": unitsGame[i].name}).draggable({start:startDrag});
			$('#control-panel').append(unit);
        }
    };
}

var startDrag = function(){
	var parent = $(this).parent();
	if (parent.hasClass("square")){
		//parent.children().remove();
		parent.data({"available": true,"unit" :"none"});
	}
}
