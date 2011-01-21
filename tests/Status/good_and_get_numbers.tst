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
            "count": 5
        }
    ]
}

{
    "cmd": "uploadArmy",
    "sid": "headcrabarrgh",
    "armyName": "People",
    "factionName": "People",
    "armyUnits": [
        {
            "name": "first",
            "count": 5
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
	"cmd": "setPlayerStatus",
	"sid": "GordonFreeman",
	"status": "in_lobby"
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
    "cmd": "getGamesList",
    "sid": "headcrabarrgh"
}

{
	"cmd": "setPlayerStatus",
	"sid": "GordonFreeman",
	"status": "ready"
}

{
    "cmd": "getGamesList",
    "sid": "headcrabarrgh"
}

{
    "cmd": "getPlayerNumber",
    "sid": "GordonFreeman",
    "gameName": "Half-life"
}

{
    "cmd": "getPlayerNumber",
	"sid": "headcrabarrgh",
    "gameName": "Half-life"
}
