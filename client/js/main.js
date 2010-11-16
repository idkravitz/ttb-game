var sections; // descriptions of toplevel sections (which behave like pages)
var session;  // session info, obtained from cookies

function setCookie(name, data)
{
    $.cookie(name, JSON.stringify(data));
    return data;
}

function deleteCookie(name)
{
    $.cookie(name, null);
}

function readCookie(name)
{
    return JSON.parse($.cookie(name));
}

function updateCookie(name, data)
{
    return setCookie(name, $.extend(readCookie(name), data));
}

function getJSON(data, handler, error_handler, disable_wait_cursor)
{
    if (disable_wait_cursor)
    {
        disableAjaxCursorChange();
    }
    $.getJSON(
        "/ajax",
        { data: JSON.stringify(data) },
        function (json)
        {
            if (json.status == 'ok')
            {
                handler(json);
            }
            else
            {
                if (error_handler == null)
                    error_handler = alert;
                error_handler(json.message);
            }
        }
    );
    if (disable_wait_cursor)
    {
        enableAjaxCursorChange();
    }
}

function disableAjaxCursorChange()
{
    $("html").unbind("ajaxStart").unbind("ajaxStop");
}

function enableAjaxCursorChange()
{
    $("html").bind("ajaxStart", function()
    {
        $(this).addClass('busy');
    }).bind("ajaxStop", function()
    {
        $(this).removeClass('busy');
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
    $("#current-user").html(s + session.username);
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
        'upload-army': initUploadArmy,
        'lobby': function()
        {
            $('#menu, #leave-game, #current-user').show();
            showCurrentUser('');
            initLobby();
        },
        'game': function()
        {
            $('#menu, #current-game, #leave-game').show();
            var map;
            getJSON(addSid({ cmd: 'getGamesList' }),
                function (json)
                {
                    var i = 0;
                    while (json.games[i].gameName != session.gameName) i++;
                    nameGameMap = json.games[i].mapName;
                    getJSON(addSid({cmd:"getMap", name: nameGameMap}),
                        function(json)
                        {
                            map = json.map;
                            drawMap(map);
                        }, null, true);
                }, null, true);
        }
    }
}

function initLobby()
{
    if(!session)
    {
        showSection("registration");
    }
    else if(!session.gameName)
    {
        showSection("active-games");
    }
    getLobbyState();
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
    if(!session.gameName) // Break loop, if we exit the game
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
    }, null, true);
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
        delayedSetTimeout();
    }, null, true);
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
                if (!session.gameName &&
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
        },
        null,
        true
    );
}

function joinGame()
{
    var gameName = $(this).text();
    getJSON(addSid({cmd: "joinGame", gameName: gameName}), function(json)
    {
        session = updateCookie('session', {gameName: gameName});
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
            extra_success(json);
        }
    );
}

function initCreateGame()
{
    updateSelect('getMapList', 'map', '#creation-');
    updateSelect('getFactionList', 'faction', '#creation-');
}

function initUploadArmy()
{
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
            session = null;
            deleteCookie("session");
            showSection("registration"); 
        });
    });
    $("#leave-game").click(function()
    {
        getJSON(addGame(addSid({cmd:"leaveGame"})), function()
        {
            delete session.gameName;
            session = setCookie("session", session);
            $("#chat").html("");
            $("#players").html("");
            showSection("active-games");
        });
    });
}

function addSid(data)
{
    return $.extend(data, { sid: session.sid });
}

function addGame(data)
{
    return $.extend(data, { gameName: session.gameName });
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
                if(session && session.username == data.username &&
                    session.gameName)
                {
                    showSection("lobby");
                    return;
                }
                session = setCookie(
                    'session', { sid: json.sid, username: data.username });
                showSection("active-games");
            }
        );
    });

    // Create Game
    $('form[name="creation"]').submit(function()
    {
        return submitForm($(this), function(json, data)
        {
            session = updateCookie("session", {gameName: data.gameName});
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
        submitForm(form, function(json, data) { 
            alert(json);
        },
        function(form) {
            var obj = {};
            obj.armyName = $('input[name="armyName"]', form).val();
            obj.factionName = $('#upload-army-faction :selected').text();
            var units = new Array();
            $('table tr', form).each(function(i, v) {
                units.push({
                    name: $('input[name="name"]', v).val(), 
                    count: $('input[name="count"]', v).val() 
                });
            });
            obj.armyUnits = units;
            return obj
        });
        return false;
    });

    function fill_units()
    {
        var fName = $('#upload-army-faction :selected').text();
        getJSON(addSid({ cmd: 'getFaction', factionName: fName }), function (json) {
                var uList = $("#upload-armyUnits").empty();
                $.each(json.unitList, function(i, v) {
                    uList.append(
                        $('<tr/>').append(
                            $('<td/>').append($('<input/>', { type: "text", name: "name", value: v.name}))
                        ).append(
                            $('<td/>').append($('<input/>', { type: "text", name: "count"}))
                        )
                    );
                });
            }, null, true);
    }

    $('#upload-army-faction').change(fill_units);
}

$(document).ready(function()
{
    enableAjaxCursorChange();
    initNavigation();
    initHorzMenu();
    initBinds();

    $("input:submit, a.button").button();

    describeSections();
    window.onhashchange = innerShowSection;
    session = readCookie("session");
    if (!showSection(getCurrentSection() || "registration"))
    {
        innerShowSection(); // force redraw to avoid artifacts
    }
});
