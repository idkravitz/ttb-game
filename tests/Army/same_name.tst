{
    "cmd": "register",
    "username": "Gordon",
    "password": "Freeman"
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
        },
        {
            "name": "second",
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
        },
        {
            "name": "second",
            "count": 3
        }
    ]
}

{
    "cmd": "register",
    "username": "Barney",
    "password": "Colhoun"
}

{
    "cmd": "uploadArmy",
    "sid": "BarneyColhoun",
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
    "cmd": "uploadMap",
    "sid": "BarneyColhoun",
    "name": "de_dust",
    "terrain": ["1..", ".x.", "..2"]
}

{
    "cmd": "createGame",
    "sid": "BarneyColhoun",
    "playersCount": 2,
    "mapName": "de_dust",
    "factionName": "People",
    "totalCost": 100,
    "gameName": "catdog"
}

{
    "cmd": "joinGame",
    "sid": "GordonFreeman",
    "gameName": "catdog"
}

{
    "cmd": "chooseArmy",
    "sid": "GordonFreeman",
    "armyName": "People"
}
