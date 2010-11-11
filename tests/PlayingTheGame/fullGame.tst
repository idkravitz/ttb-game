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
    "terrain": [
        "111.",
        ".x..",
        "..x.",
        ".222"]
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
        },
        {
            "name": "brown",
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
            "name": "white",
            "count": 2
        },    
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
    "totalCost": 3,
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
            "name": "white",
            "posX": 0,
            "posY": 0
        },
        {
            "name": "brown",
            "posX": 1,
            "posY": 0
        },
        {
            "name": "brown",
            "posX": 2,
            "posY": 0
        }                 
    ]
}

{
    "cmd": "placeUnits",
    "sid": "BarneyColhoun",
    "units": [
        {
            "name": "white",
            "posX": 3,
            "posY": 3
        },
        {
            "name": "white",
            "posX": 2,
            "posY": 3
        },
        {
            "name": "brown",
            "posX": 1,
            "posY": 3
        }                 
    ]
}

{
    "cmd": "move",
    "sid": "GordonFreeman",
    "turn": 1,
    "units": [
    {
        "posX": 0,
        "posY": 0,
        "destX": 0,
        "destY": 1,
        "attackX": -1,
        "attackY": -1
    },
    {
        "posX": 1,
        "posY": 0,
        "destX": 0,
        "destY": 0,
        "attackX": -1,
        "attackY": -1
    },    
    {
        "posX": 2,
        "posY": 0,
        "destX": 1,
        "destY": 0,
        "attackX": -1,
        "attackY": -1
    }           
    ]
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 1,
    "units": [
    {
        "posX": 3,
        "posY": 3,
        "destX": 2,
        "destY": 3,
        "attackX": -1,
        "attackY": -1
    },
    {
        "posX": 2,
        "posY": 3,
        "destX": 1,
        "destY": 3,
        "attackX": -1,
        "attackY": -1
    },    
    {
        "posX": 1,
        "posY": 3,
        "destX": 1,
        "destY": 2,
        "attackX": -1,
        "attackY": -1
    }           
    ]
}

{
    "cmd": "move",
    "sid": "GordonFreeman",
    "turn": 2,
    "units": [
    {
        "posX": 0,
        "posY": 1,
        "destX": 0,
        "destY": 2,
        "attackX": 1,
        "attackY": 2
    },
    {
        "posX": 0,
        "posY": 0,
        "destX": 0,
        "destY": 1,
        "attackX": 1,
        "attackY": 2
    },    
    {
        "posX": 1,
        "posY": 0,
        "destX": 0,
        "destY": 0,
        "attackX": -1,
        "attackY": -1
    }           
    ]
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 2,
    "units": [
    {
        "posX": 2,
        "posY": 3,
        "destX": 1,
        "destY": 3,
        "attackX": -1,
        "attackY": -1
    },
    {
        "posX": 1,
        "posY": 3,
        "destX": 0,
        "destY": 3,
        "attackX": -1,
        "attackY": -1
    },    
    {
        "posX": 1,
        "posY": 2,
        "destX": 1,
        "destY": 2,
        "attackX": -1,
        "attackY": -1
    }           
    ]
}

{
    "cmd": "move",
    "sid": "GordonFreeman",
    "turn": 3,
    "units": [
    {
        "posX": 0,
        "posY": 2,
        "destX": 1,
        "destY": 2,
        "attackX": 0,
        "attackY": 3
    },
    {
        "posX": 0,
        "posY": 1,
        "destX": 0,
        "destY": 2,
        "attackX": 0,
        "attackY": 3
    },    
    {
        "posX": 0,
        "posY": 0,
        "destX": 0,
        "destY": 1,
        "attackX": 0,
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
        "posX": 1,
        "posY": 3,
        "destX": 1,
        "destY": 3,
        "attackX": 0,
        "attackY": 2
    },
    {
        "posX": 0,
        "posY": 3,
        "destX": 0,
        "destY": 3,
        "attackX": 0,
        "attackY": 2
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
    "turn": 4,
    "units": [
    {
        "posX": 1,
        "posY": 2,
        "destX": 1,
        "destY": 2,
        "attackX": 1,
        "attackY": 3
    },
    {
        "posX": 0,
        "posY": 2,
        "destX": 0,
        "destY": 2,
        "attackX": 1,
        "attackY": 3
    },    
    {
        "posX": 0,
        "posY": 1,
        "destX": 0,
        "destY": 1,
        "attackX": 1,
        "attackY": 3
    }           
    ]
}

{
    "cmd": "move",
    "sid": "BarneyColhoun",
    "turn": 4,
    "units": [
    {
        "posX": 1,
        "posY": 3,
        "destX": 1,
        "destY": 3,
        "attackX": 1,
        "attackY": 2
    }         
    ]
}

{
    "cmd": "getGameState",
    "name": "BlackMesa"
}
