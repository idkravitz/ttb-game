
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
    "name": "x_2",
    "terrain": [
        "11111",
        ".x1x.",
        "..x..",
        ".x2x.",
        "22222"]
}

{"armyName":"2","factionName":"Headcrabs","armyUnits":[{"name":"regular","count":0},{"name":"speedy","count":0},{"name":"poisoned","count":2}],"cmd":"uploadArmy","sid":"GordonFreeman"}

{"armyName":"1","factionName":"Headcrabs","armyUnits":[{"name":"regular","count":3},{"name":"speedy","count":0},{"name":"poisoned","count":0}],"cmd":"uploadArmy","sid":"BarneyColhoun"}

{"gameName":"123","totalCost":100,"playersCount":2,"mapName":"x_2","factionName":"Headcrabs","cmd":"createGame","sid":"BarneyColhoun"}

{"cmd":"joinGame","gameName":"123","sid":"GordonFreeman"}

{"cmd":"chooseArmy","armyName":"1","sid":"BarneyColhoun"}
{"cmd":"setPlayerStatus","status":"ready","sid":"BarneyColhoun"}

{"cmd":"chooseArmy","armyName":"2","sid":"GordonFreeman"}
{"cmd":"setPlayerStatus","status":"ready","sid":"GordonFreeman"}
{"cmd":"placeUnits","units":[{"name":"regular","posX":0,"posY":0},{"name":"regular","posX":4,"posY":0}],"sid":"BarneyColhoun"}
{"cmd":"placeUnits","units":[{"name":"poisoned","posX":1,"posY":4},{"name":"poisoned","posX":3,"posY":4}],"sid":"GordonFreeman"}
