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
            "protection": 1,
            "initiative": 1,
            "cost": 1
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
    "playersCount": 3
}

{
    "cmd": "register",
    "username": "Barney",
    "password": "Calhoun"
}

{
    "cmd": "joinGame",
    "sid": "BarneyCalhoun",
    "gameName": "Half-life"
}

{
    "cmd": "getPlayersListForGame",
    "sid": "GordonFreeman",
    "gameName": "Half-life"
}

{
    "cmd": "unregister",
    "sid": "BarneyCalhoun"
}

{
    "cmd": "getPlayersListForGame",
    "sid": "GordonFreeman",
    "gameName": "Half-life"
}
