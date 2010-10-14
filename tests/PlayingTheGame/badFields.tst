{
    "cmd": "register",
    "username": "Gordon",
    "password": "Freeman"
}

{
    "cmd": "register",
    "username": "headcrab",
    "password": "arrgh"
}

{
    "cmd": "uploadMap",
    "sid": "GordonFreeman",
    "name": "de_dust",
    "terrain": ["1..", ".x.", "..2"]
}

{
    "cmd": "uploadFaction",
    "sid": "GordonFreeman",
    "factionName": "People",
    "units": [
        {
            "name": "first",
            "HP": 1,
            "MP": 1,
            "defence": 1,
            "attack": 1,
            "range": 1,
            "damage": 1,
            "protection": 1,
            "initiative": 1,
            "cost": 1
        }
    ]
}

{
    "cmd": "uploadArmy",
    "sid": "GordonFreeman",
    "armyName": "People",
    "factionName": "People",
    "armyUnits": [
        {
            "name": "first",
            "count": 1
        }
    ]
}

{
    "cmd": "createGame",
    "sid": "GordonFreeman",
    "gameName": "Half-life",
    "mapName": "de_dust",
    "factionName": "People",
    "totalCost": 100,
    "playersCount": 2
}

{
    "cmd": "chooseArmy",
    "sid": "GordonFreeman",
    "armyName": "People"
}

{
	"cmd": "setPlayerStatus",
	"sid": "GordonFreeman",
	"status": "ready"
}

{
	"cmd": "placeUnits",
	"sid": "GordonFreeman",
	"units": [
        {
            "name": "first",
            "posX": "1",
            "posY": "1"
        }
    ]
}

{
    "cmd": "joinGame",
    "sid": "headcrabarrgh",
    "gameName": "Half-life"
}

{
    "cmd": "chooseArmy",
    "sid": "headcrabarrgh",
    "armyName": "People"
}

{
	"cmd": "setPlayerStatus",
	"sid": "headcrabarrgh",
	"status": "ready"
}

{
    "cmd": "getGameState",
    "name": "Half-life"
}


{
	"cmd": "placeUnits",
	"sid": "GordonFreeman",
	"units": [
        {
            "name": "first",
            "posX": 1
        }
    ]
}

{
	"cmd": "placeUnits",
	"sid": "GordonFreeman",
	"units": [
        {
            "name": "xxx",
            "posX": 1,
            "posY": 1
        }
    ]
}

{
	"cmd": "placeUnits",
	"sid": "GordonFreeman",
	"units": [
        {
            "name": "first",
            "posX": 2,
            "posY": 2
        }
    ]
}
