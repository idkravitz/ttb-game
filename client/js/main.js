var sections; // descriptions of toplevel sections (which behave like pages)

function inGame()
{
    return cookie.fields.gameName;
}

function getJSON(data, handler, error_handler)
{
    $.getJSON('/ajax', { data: JSON.stringify(data) }, function (json)
    {
        if (json.status == 'ok')
        {
            handler(json);
        }
        else
        {
            (error_handler || alert)(json.message);
        }
    });
}

function showSection(section_name)
{
    if (getCurrentSection() == section_name)
    {
        return false;
    }
    window.location.hash = section_name;
    return true;
}

function getCurrentSection()
{
    return window.location.hash.substr(1); // remove # symbol
}

function showCurrentUser(s)
{
    $("#current-user").html(s + cookie.fields.username);
}

function innerShowSection()
{
    var section = getCurrentSection();
    if (!section || !(section in sections))
    {
        window.location.hash = "registration";
        return;
    }

    $('#content > *, #menu, #menu > li').hide();
    $('#' + section).show();
    if (section != 'registration' && section != 'lobby' && section != 'game')
    {
        $('nav > p').removeClass('nav-current');
        $('#nav-' + section).addClass('nav-current');

        showCurrentUser('Welcome, ');

        $('#menu, #menu li[id!="leave-game"], nav, #nav-vertical-line').show();
    }
    sections[section]();
}

function describeSections()
{
    sections = {
        'registration': $.noop,
        'about': $.noop,
        'active-games': function()
        {
            $('#active-games > *').hide();
            getGamesList();
        },
        'create-game': initCreateGame,
        'manage-armies': initManageArmies,
        'lobby': function()
        {
            $('#menu, #leave-game, #current-user').show();
            showCurrentUser('');
            initLobby();
        },
        'game': initGame
    }
}

function initGame()
{
    $('#menu, #current-game, #leave-game').show();
    var map;
    getJSON(addSid({ cmd: 'getGamesList' }),
        function (json)
        {
            var i = 0;
            while (json.games[i].gameName != cookie.fields.gameName) i++;
            nameGameMap = json.games[i].mapName;
            getJSON(addSid({cmd:"getMap", name: nameGameMap}),
                function(json)
                {
                    map = json.map;
                    drawMap(map);
                });
        });
}

function initLobby()
{
    getArmiesList();
    if(cookie.isEmpty())
    {
        showSection("registration");
    }
    else if(!inGame())
    {
        showSection("active-games");
    }
    getLobbyState();
}

function getArmiesList()
{
    getJSON(addSid({ cmd: 'getGamesList'}), function (json)
    {
        var nFaction;
        var nCost;
        for (var i = 0; i < json.games.length; i++)
        {
            if (json.games[i].gameName == cookie.fields.gameName)
            {
                nFaction = json.games[i].factionName;
                nCost = json.games[i].totalCost;
            }
        }
        getJSON(addSid({ cmd: 'getArmiesList'}), function (json)
        {
            for (var i = 0; i < json.armies.length; i++)
            {
                if ((json.armies[i].cost <= nCost) && (json.armies[i].faction == nFaction))
                    $('#creation-army').append($("<option value="+i+">"+json.armies[i].name+"</option>") );
            }
        }, null, true);
    }, null, true);
}

function getLobbyState()
{
    var command = addSid(addGame({ cmd: 'getChatHistory' }));
    var calls = 2;
    function delayedSetTimeout()
    {
        if(!--calls)
        {
            setTimeout("getLobbyState()", 3000);
        }
    }
    if(!inGame())
    {
        return;
    }
    if (sections.lobby.last_id)
    {
        $.extend(command, { since: sections.lobby.last_id });
    }
    getJSON(command, function (json)
    {
        if (json.chat.length)
        {
            sections.lobby.last_id = json.chat[json.chat.length-1].id;
            $.each(json.chat, function(i, rec)
            {
                $('#chat').append($('<div/>')
                    .append($('<p/>', {class: 'chat-name', text: rec.username}))
                    .append($('<p/>', {class: 'chat-message', text: rec.message}))
                );
            });
        }
        delayedSetTimeout();
    });
    getJSON(addGame(addSid({cmd:"getPlayersListForGame"})), function(json)
    {
        $("#players").html("");
        $.each(json.players, function(i, rec)
        {
            $('#players').append($('<tr/>')
                .append($('<td/>', {text: rec.username}))
                .append($('<td/>', {class: 'state', text: rec.status.replace('_', ' ')}))
            );
        });
        var startGame = true;
        for (var i = 0; i < json.players.length; i++)
        {
            if (json.players[i].status == 'in_lobby') startGame = false;
        }
        if (startGame) showSection("game");
        delayedSetTimeout();
    });
}

function getGamesList()
{
    if(getCurrentSection() != "active-games")
    {
        return;
    }
    getJSON(
        addSid({ cmd: 'getGamesList' }),
        function (json)
        {
            var table = $('#active-games table');
            var empty_message = $('#active-games #empty-server');
            if (!json.games.length)
            {
                table.hide();
                empty_message.show();
                return;
            }

            $('tr', table).not($('tr', table).first()).remove();
            $.each(json.games, function(i, game)
            {
                var row = $('<tr/>');

                var name = game.gameName;
                if (!inGame() &&
                    (game.connectedPlayersCount != game.playersCount) &&
                    (game.gameStatus == 'not_started'))
                {
                    name = $('<a/>', {href: '#', text: name});
                }

                var players = game.connectedPlayersCount + ' / ' + game.playersCount;
                var order = [
                    name,
                    game.gameStatus.replace('_', ' '),
                    players,
                    game.mapName,
                    game.factionName,
                    game.totalCost
                ];
                $.each(order, function(j, value)
                {
                    $(row).append(
                        $('<td/>').append(value)
                    );
                });
                table.append(row);
            });
            $('a', table).click(joinGame);
            empty_message.hide();
            table.show();
            setTimeout("getGamesList()", 3000);
        }
    );
}

function joinGame()
{
    var gameName = $(this).text();
    getJSON(addSid({cmd: "joinGame", gameName: gameName}), function(json)
    {
        cookie.store({ gameName: gameName });
        showSection('lobby');
    });
    return false;
}

function updateSelect(command, attr, id, extra_success)
{
    getJSON(
        addSid({ cmd: command }),
        function (json) {
            var array = attr + 's';
            var select = $(id + attr);
            select.empty();
            $.each(json[array], function(i, option) {
                select.append(new Option(option[attr], i));
            });
            if(extra_success)
                extra_success(json);
        }
    );
}

function convertToSlider(id, vmin, vmax, step)
{
    var input = $('#' + id);
    var label = input.prev();
    var prefix = label.text().split(':')[0] + ': ';
    var slider_id = id + '-slider';

    input.hide();
    input.val(vmin);
    label.text(prefix + vmin);

    $('#' + slider_id).remove();
    input.after(
        $('<div/>', { id: slider_id }).slider({
            range: 'min',
            value: vmin,
            min: vmin,
            max: vmax,
            step: step || 1,
            slide: function (event, ui) {
                input.val(parseInt(ui.value));
                label.text(prefix + ui.value);
            }
        })
    );
}

function initCreateGame()
{
    updateSelect('getMapList', 'map', '#creation-');
    updateSelect('getFactionList', 'faction', '#creation-');
    convertToSlider('creation-playerscount', 2, 16);
    convertToSlider('creation-moneylimit', 100, 1000, 50);
}

function initManageArmies()
{
    $('#manage-armies > *').hide();
    getJSON(addSid({ cmd: 'getArmiesList' }), function (json) {
        $('#army-view > *').hide();
        $('#army-view').show();
        if(json.armies.length) {
            var table = $('#army-view table');
            $('tr', table).not($('tr', table).first()).remove();
            $.each(json.armies, function (i, army) {
                table.append($('<tr/>')
                    .append($('<td/>').text(army.name))
                    .append($('<td/>').text(army.faction))
                    .append($('<td/>').text(army.cost)));
            });
            table.show();
        }
        $('#army-view a.button').show();
    });
    updateSelect('getFactionList', 'faction', '#upload-army-', function() {
        $('#upload-army-faction').change();
    });
}

function initNavigation()
{
    var items = $("nav > p");

    $(".main-section").hide();
    items.click(function()
    {
        var item = $(this);

        if (item.hasClass("nav-current")) return;
        $.each(items, function() { $(this).removeClass("nav-current"); });
        item.addClass("nav-current");

        showSection(item.attr('id').substring(4)); // strip 'nav-' prefix
    });

    // add animation
    var pad_out = 25;
    var pad_in = 15;
    items.each(function()
    {
        $(this).hover(function()
        {
            $(this).animate({ paddingLeft: pad_out }, 150);
        },
        function()
        {
            $(this).animate({ paddingLeft: pad_in }, 150);
        });
    });
}

function initHorzMenu()
{
    $("#sign-out").click(function()
    {
        getJSON(addSid({ cmd: "unregister" }), function(json)
        {
            cookie.clear();
            showSection("registration");
        });
    });
    $("#leave-game").click(function()
    {
        getJSON(addGame(addSid({cmd:"leaveGame"})), function()
        {
            cookie.remove('gameName');
            $("#chat").html("");
            $("#players").html("");
            showSection("active-games");
        });
    });
}

function addSid(data)
{
    return $.extend(data, { sid: cookie.fields.sid });
}

function addGame(data)
{
    return $.extend(data, { gameName: cookie.fields.gameName });
}

function submitForm(form, handler, grabber)
{
    function formError(form, text)
    {
        $('.error', form).remove();
        form.prepend(
            $('<p/>', {class: 'error ui-corner-all'})
            .append($('<img/>', { src: '/images/error.png' }))
            .append(text)
        );
    }

    function grabForm(form)
    {
        var obj = {};
        $("input[type!='submit'], textarea", form).each(function(i, v)
        {
            obj[$(v).attr('name')] = $(v).hasClass('int-value') ? parseInt($(v).val()) : $(v).val();
        });
        $("select", form).each(function(i, v)
        {
            obj[$(v).attr('name')] = $(':selected', v).text();
        });
        return obj;
    }

    var data = grabber ? grabber(form): grabForm(form);
    var commands = {
        registration: function() { return { cmd: 'register' }; },
        creation: function() { return addSid({ cmd: 'createGame' }); },
        'upload-army': function() { return addSid({ cmd: 'uploadArmy' }); },
        message: function() { return addGame(addSid({ cmd: 'sendMessage'})); }
    }

    getJSON(
        $.extend(data, commands[form.attr('name')]()),
        function (json) { handler(json, data); clearForm(form); },
        function (message) { formError(form, message); }
    );

    return false; // ban POST requests
}

function clearForm(form)
{
    $('.error', form).remove();
    $('input[type!="submit"]', form).val('');
}

function initBinds()
{
    // Registration
    $('form[name="registration"]').submit(function()
    {
        return submitForm($(this), function(json, data)
            {
                if(!cookie.isEmpty() && cookie.fields.username == data.username &&
                    inGame())
                {
                    showSection("lobby");
                    return;
                }
                cookie.clear();
                cookie.store({ sid: json.sid, username: data.username });
                showSection("active-games");
            }
        );
    });

    // Create Game
    $('form[name="creation"]').submit(function()
    {
        return submitForm($(this), function(json, data)
        {
            cookie.store({ gameName: data.gameName });
            showSection("lobby");
        });
    });

    // Lobby
    $('form[name="message"]').submit(function()
    {
        var form = $(this);
        return submitForm(form,
            function() { $('#message-text', form).val(''); });
    });

    // Upload Army
    $('form[name="upload-army"]').submit(function()
    {
        var form = $(this);
        return submitForm(form, initManageArmies, function(form) {
            return {
                'armyName': $('input[name="armyName"]', form).val(),
                'factionName': $('#upload-army-faction :selected').text(),
                'armyUnits': $.map($('li', form), function(v, i) {
                    return {
                        'name': $('label', v).text(),
                        'count': parseInt($('input', v).val())
                    };
                })
            };
        });
    });

    $('#creation-army').change(function () {
        var aName = $('#creation-army :selected').text();
        getJSON(addSid({ cmd: 'chooseArmy', armyName: aName }), $.noop);
    });

    $('#set-status').click(function(){
        var status = $('#set-status').is(':checked') ? 'ready' : 'in_lobby';
        getJSON(addSid({ cmd: 'setPlayerStatus', status: status }), $.noop)
    });

    $('#upload-army-faction').change(function () {
        var fName = $('#upload-army-faction :selected').text();
        $('#unit-info').empty();
        getJSON(addSid({ cmd: 'getFaction', factionName: fName }), function (json) {
            var uList = $("#upload-army-units").empty();
            $.each(json.unitList, function(i, v) {
                var unit = $('<li/>');
                var unit_id = 'unit-army-' + v.name;
                unit.append($('<label/>', { 'for': unit_id }).text(v.name).data(v))
                    .append($('<input/>', { type: 'text', id: unit_id, value: 0 }))
                    .append($('<p/>', { class: 'cost' }))
                    .append($('<div/>', { class: 'slider-count' }));
                $('.slider-count', unit).slider({
                    range: 'min',
                    value: 0,
                    min: 0,
                    max: 50,
                    slide: function (event, ui) {
                        $('input', unit).val(ui.value);
                        $('.cost', unit).text('$' + ui.value * v.cost);
                    }
                });
                uList.append(unit);
            });
            $('label', uList).click(function() {
                $('#unit-info').empty();
                var info = $(this).data();
                const fields = {
                    'name': 'Name',
                    'HP': 'Health',
                    'attack': 'Attack',
                    'defence': 'Defence',
                    'range': 'Range',
                    'damage': 'Damage',
                    'protection': 'Protection',
                    'initiative': 'Initiative',
                    'MP': 'Speed',
                    'cost': 'Cost'
                };
                $.each(fields, function(i, v) {
                    $('#unit-info').append(
                        $('<tr/>').append($('<th/>').text(v))
                                  .append($('<td/>').text(info[i])));
                });
            });
        });
    });

    $('#add-army').click(function() {
        $('#army-view').hide();
        $('#army-edit').show();
        return false;
    });
}

$(document).ready(function()
{
    initNavigation();
    initHorzMenu();
    initBinds();

    $("input:submit, a.button").button();

    describeSections();
    window.onhashchange = innerShowSection;
    if (!showSection(getCurrentSection() || "registration"))
    {
        innerShowSection(); // force redraw to avoid artifacts
    }
});
