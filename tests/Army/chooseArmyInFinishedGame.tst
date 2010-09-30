{
    "cmd": "register",
    "username": "Gordon",
    "password": "Freeman"
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
            "cost": 1
        },
        {
            "name": "second",
            "HP": 1,
            "MP": 1,
            "defence": 1,
            "attack": 1,
            "range": 1,
            "damage": 1,
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
        },
        {
            "name": "second",
            "count": 3
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
    "playersCount": 10
}

{
	"cmd": "leaveGame",
	"sid": "GordonFreeman",
    "gameName": "Half-life"
}
    
{
    "cmd": "chooseArmy",
    "sid": "GordonFreeman",
    "armyName": "People"
}