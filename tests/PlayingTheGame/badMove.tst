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
            "name": "white",
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
            "name": "brown",
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
    "cmd": "uploadMap",
    "sid": "GordonFreeman",
    "name": "BlackMesa",
    "terrain": ["1..", ".x.", "..2"]
}

{
    "cmd": "uploadArmy",
    "sid": "GordonFreeman",
    "armyName": "GF",
    "factionName": "Headcrabs",
    "armyUnits": [
        {
            "name": "white",
            "count": 1
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
            "name": "brown",
            "count": 1
        }
    ]
}

{
    "cmd": "createGame",
    "sid": "GordonFreeman",
    "gameName": "BlackMesa",
    "mapName": "BlackMesa",
    "factionName": "Headcrabs",
    "totalCost": 1,
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
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": "1",
    "units": [
        { 
            "name": "<first>",
            "posX": "1",
            "posY": "1",
            "destX": "1",
            "destY": "1",
            "attackX": "1",
            "attackY": "1"
        }
    ]               
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 1,
    "units": [
        { 
            "name": "<first>",
            "posX": "1",
            "posY": "1",
            "destX": "1",
            "destY": "1",
            "attackX": "1",
            "attackY": "1"
        }
    ]               
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
            "name": "white",
            "posX": 0,
            "posY": 0
        }
    ]
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 1,
    "units": [
        { 
            "name": "brown",
            "posX": "1",
            "posY": "1",
            "destX": "1",
            "destY": "1",
            "attackX": "1",
            "attackY": "1"
        }
    ]               
}

{
    "cmd": "placeUnits",
    "sid": "BarneyColhoun",
    "units": [
        {
            "name": "brown",
            "posX": 2,
            "posY": 2
        }
    ]
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 1,
    "units": [
        { 
            "name": "white",
            "posX": "1",
            "posY": "1",
            "destX": "1",
            "destY": "1",
            "attackX": "1",
            "attackY": "1"
        }
    ]               
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 1,
    "units": [
        { 
            "name": "brown",
            "posX": "1",
            "posY": "1",
            "destX": "1",
            "destY": "1",
            "attackX": "1",
            "attackY": "1"
        }
    ]               
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 1,
    "units": [
        { 
            "posX": "1",
            "posY": "1",
            "destX": "1",
            "destY": "1",
            "attackX": "1",
            "attackY": "1"
        }
    ]               
}
