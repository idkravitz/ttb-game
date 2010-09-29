{
    "cmd": "register",
    "username": "cat",
    "password": "meow"
}

{
    "cmd": "register",
    "username": "dog",
    "password": "bark"
}

{
    "cmd": "uploadMap",
    "sid": "catmeow",
    "name": "de_dust",
    "terrain": ["1..", ".x.", "..2"]
}

{
    "cmd": "uploadFaction",
    "sid": "catmeow",
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
        }
    ]
}

{
    "cmd": "createGame",
    "sid": "catmeow",
    "playersCount": 2,
    "mapName": "de_dust",
    "factionName": "People",
    "totalCost": 100,
    "gameName": "catdog"
}

{
    "cmd": "joinGame",
    "sid": "dogbark",
    "gameName": "cat"
}
