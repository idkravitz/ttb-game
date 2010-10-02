{
    "cmd": "register",
    "username": "Gordon",
    "password": "Freeman"
}

{
    "cmd": "register",
    "username": "Addy",
    "password": "Crack"
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
    "cmd": "joinGame",
    "sid": "AddyCrack",
    "gameName": "Half-life"
}

{
    "cmd": "sendMessage",
    "sid": "GordonFreeman",
    "gameName": "Half-life",
    "text": "..."
}

{
    "cmd": "sendMessage",
    "sid": "AddyCrack",
    "gameName": "Half-life",
    "text": "hihihihihihihihihihihi"
}

{
    "cmd": "sendMessage",
    "sid": "GordonFreeman",
    "gameName": "Half-life",
    "text": "spssps"
}

{
    "cmd": "getChatHistory",
    "sid": "GordonFreeman",
    "gameName": "Half-life"
}
