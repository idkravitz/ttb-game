{
    "cmd": "register",
    "username": "Gordon",
    "password": "Freeman"
}

{
    "cmd": "register",
    "username": "Barney",
    "password": "Colhoun"
}

{
    "cmd": "uploadFaction",
    "sid": "GordonFreeman",
    "factionName": "Headcrabs",
    "units": [
        {
            "name": "regular",
            "HP": 5,
            "MP": 2,
            "defence": 2,
            "attack": 3,
            "range": 2,
            "damage": 2,
            "protection": 1,
            "initiative": 1,
            "cost": 1
        },
        {
            "name": "speedy",
            "HP": 4,
            "MP": 4,
            "defence": 1,
            "attack": 2,
            "range": 2,
            "damage": 1,
            "protection": 1,
            "initiative": 1,
            "cost": 2
        },
        {
            "name": "poisoned",
            "HP": 6,
            "MP": 2,
            "defence": 1,
            "attack": 4,
            "range": 2,
            "damage": 3,
            "protection": 1,
            "initiative": 2,
            "cost": 3
        }
    ]
}

{
    "cmd": "uploadMap",
    "sid": "GordonFreeman",
    "name": "BlackMesa",
    "terrain": [
        "11111",
        "..x..",
        "x.x.x",
        "..x..",
        "22222"
    ]
}

{
    "cmd": "uploadArmy",
    "sid": "GordonFreeman",
    "armyName": "GF",
    "factionName": "Headcrabs",
    "armyUnits": [
        {
            "name": "regular",
            "count": 3
        },
        {
            "name": "speedy",
            "count": 2
        }
    ]
}

{
    "cmd": "uploadArmy",
    "sid": "BarneyColhoun",
    "armyName": "BC",
    "factionName": "Headcrabs",
    "armyUnits": [
        {
            "name": "regular",
            "count": 1
        },
        {
            "name": "poisoned",
            "count": 2
        }
    ]
}

{
    "cmd": "createGame",
    "sid": "GordonFreeman",
    "gameName": "BlackMesa",
    "mapName": "BlackMesa",
    "factionName": "Headcrabs",
    "totalCost": 7,
    "playersCount": 2
}

{
    "cmd": "joinGame",
    "sid": "BarneyColhoun",
    "gameName": "BlackMesa"
}

{
    "cmd": "chooseArmy",
    "sid": "GordonFreeman",
    "armyName": "GF"
}

{
    "cmd": "chooseArmy",
    "sid": "BarneyColhoun",
    "armyName": "BC"
}

{
    "cmd": "setPlayerStatus",
    "sid": "GordonFreeman",
    "status": "ready"
}

{
    "cmd": "setPlayerStatus",
    "sid": "BarneyColhoun",
    "status": "ready"
}

{
    "cmd": "placeUnits",
    "sid": "GordonFreeman",
    "units": [
        {
            "name": "regular",
            "posX": 1,
            "posY": 0
        },
        {
            "name": "regular",
            "posX": 2,
            "posY": 0
        },
        {
            "name": "regular",
            "posX": 3,
            "posY": 0
        },
        {
            "name": "speedy",
            "posX": 0,
            "posY": 0
        },
        {
            "name": "speedy",
            "posX": 4,
            "posY": 0
        }
    ]
}

{
    "cmd": "placeUnits",
    "sid": "BarneyColhoun",
    "units": [
        {
            "name": "regular",
            "posX": 2,
            "posY": 4
        },
        {
            "name": "poisoned",
            "posX": 1,
            "posY": 4
        },
        {
            "name": "poisoned",
            "posX": 3,
            "posY": 4
        }
    ]
}

{
    "cmd": "getGameState",
    "name": "BlackMesa"
}

{
    "cmd": "move",
    "sid": "GordonFreeman",
    "turn": 1,
    "units": [
        {
            "posX": 1,
            "posY": 0,
            "destX": 1,
            "destY": 1,
            "attackX": 1,
            "attackY": 4
       },
       {
            "posX": 3,
            "posY": 0,
            "destX": 3,
            "destY": 1,
            "attackX": 3,
            "attackY": 4
       }
    ]
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 1,
    "units": [
        {
            "posX": 1,
            "posY": 4,
            "destX": 1,
            "destY": 3,
            "attackX": 1,
            "attackY": 0
       },
       {
            "posX": 3,
            "posY": 4,
            "destX": 3,
            "destY": 3,
            "attackX": 3,
            "attackY": 0
       }
    ]
}

{
    "cmd": "getGameState",
    "name": "BlackMesa"
}

{
    "cmd": "move",
    "sid": "GordonFreeman",
    "turn": 2,
    "units": [
        {
            "posX": 0,
            "posY": 0,
            "destX": 1,
            "destY": 2,
            "attackX": 1,
            "attackY": 3
       },
       {
            "posX": 4,
            "posY": 0,
            "destX": 3,
            "destY": 2,
            "attackX": 3,
            "attackY": 3
       }
    ]
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 2,
    "units": [
        {
            "posX": 1,
            "posY": 3,
            "destX": 1,
            "destY": 2,
            "attackX": 0,
            "attackY": 0
       },
       {
            "posX": 3,
            "posY": 3,
            "destX": 3,
            "destY": 2,
            "attackX": 4,
            "attackY": 0
       }
    ]
}

{
    "cmd": "getGameState",
    "name": "BlackMesa"
}

{
    "cmd": "move",
    "sid": "GordonFreeman",
    "turn": 3,
    "units": [
        {
            "posX": 2,
            "posY": 0,
            "destX": 3,
            "destY": 1,
            "attackX": 3,
            "attackY": 3
       }
    ]
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 3,
    "units": [
        {
            "posX": 3,
            "posY": 3,
            "destX": 3,
            "destY": 3,
            "attackX": 2,
            "attackY": 0
       }
    ]
}

{
    "cmd": "getGameState",
    "name": "BlackMesa"
}
