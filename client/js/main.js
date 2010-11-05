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

function innerShowSection()
{
    var section_name = getCurrentSection();
    if (!section_name || !(section_name in sections))
    {
        window.location.hash = "registration";
        return;
    }

    section = sections[section_name];
    $("#content > section").hide();
    section.init();
    section.body.show();
    $.each(section.show, function(i, v) { v.show(); });
    $.each(section.hide, function(i, v) { v.hide(); });

    $('nav > p').removeClass('nav-current');
    $('#nav-' + section_name).addClass('nav-current');
}

function describeSections()
{
    sections = {
        'registration': {                                          // key for anchor
            body: $("#registration"),                              // what section to show (maybe move in 'show')
            hide: [$("#menu"), $("nav"), $("#nav-vertical-line")], // elements to hide
            show: [],                                              // elements to show
            init: initRegistration                                 // actions to perform after showing
        },
        'about': {
            body: $('#about'),
            hide: [],
            show: [$('#menu'), $("nav")],
            init: function() {}
        },
        'active-games': {
            body: $('#active-games'),
            hide: [$("#leave-game")],
            show: [$("#nav-vertical-line"), $('#menu'), $("nav"), $("#menu li").not($("#leave-game"))],
            init: getGamesList,
        },
        'create-game': {
            body: $('#create-game'),
            hide: [$("#leave-game")],
            show: [$("#nav-vertical-line"), $('#menu'), $("nav")],
            init: initCreateGame,
        },
        'upload-army': {
            body: $('#upload-army'),
            hide: [],
            show: [$("#nav-vertical-line"), $('#menu'), $("nav")],
            init: function() {}
        },
        'lobby': {
            body: $("#lobby"),
            show: [$("#menu"), $("#leave-game")],
            hide: [$("nav"), $("#nav-vertical-line"), $("#menu li").not($("#leave-game"))],
            init: initLobby
        }
    }
}

function initRegistration() { }

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
               var name = $(document.createElement("p")).addClass("chat-name");
               var message = $(document.createElement("p")).addClass("chat-message");
               name.text(rec.username);
               message.text(rec.message);
               var record = $(document.createElement("div"));
               record.append(name).append(message);
               $("#chat").append(record);
           });
        }
        delayedSetTimeout();
    }, null, true);
    getJSON(addGame(addSid({cmd:"getPlayersListForGame"})), function(json)
    {
        $("#players").html("");
        $.each(json.players, function(i, rec)
        {
            var row = $(document.createElement("tr"));
            var user = $(document.createElement("td"));
            var state = $(document.createElement("td"));
            user.text(rec.username);
            state.text(rec.status.replace("_", " ")).addClass("state");
            row.append(user).append(state);
            $("#players").append(row);
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
                if (game.gameStatus != 'finished')
                {
                    var row = document.createElement('tr');
                    var players = game.connectedPlayersCount + ' / ' + game.playersCount;
                    var order = [
                        session.gameName ? game.gameName:
                            '<a href="#">' + game.gameName + '</a>' ,
                        game.gameStatus.replace('_', ' '),
                        players,
                        game.mapName,
                        game.factionName,
                        game.totalCost
                    ];
                    $.each(order,
                        function(j, string){
                            $(row).append('<td>' + string + '</td>');
                        }
                    );
                    table.append(row);
                }
            });
            $('a', table).click(joinGame);
            empty_message.hide();
            table.show();
        },
        null,
        true
    );
    setTimeout("getGamesList()", 3000);
}

function joinGame()
{
    var gameName = $(this).text()
    getJSON(addSid({cmd: "joinGame", gameName: gameName}), function(json)
    {
        session = updateCookie('session', {gameName: gameName});
        showSection('lobby');
    });
    return false;
}

function initCreateGame()
{
    function updateSelect(command, attr)
    {
        getJSON(
            addSid({ cmd: command }),
            function (json)
            {
                var array = attr + 's';
                var select = $('#creation-' + attr);
                select.empty();
                $.each(json[array], function(i, value)
                {
                    select.append(
                       $('<option value="' + i + '">' + value[attr] + '</option>'));
                });
            }
        );
    }
    updateSelect('getMapList', 'map');
    updateSelect('getFactionList', 'faction');
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

function submitForm(form, handler)
{
    function formError(form, text)
    {
        form.prepend(
            '<p class="error ui-corner-all">' +
            '<img src="/images/error.png">' + text + '</p>');
    }

    function grabForm(form)
    {
        var obj = {};
        $("input[type!='submit'], textarea", form).each(function(i, v)
        {
            obj[$(v).attr('name')] = $(v).attr('rel') == 'int' ? parseInt($(v).val()) : $(v).val();
        });
        $("select", form).each(function(i, v)
        {
            obj[$(v).attr('name')] = $(':selected', v).text();
        });
        return obj;
    }

    var data = grabForm(form);
    var commands = {
        registration: function () { return { cmd: 'register' }; },
        creation: function () { return addSid({ cmd: 'createGame' }); },
        message: function() { return addGame(addSid({cmd: 'sendMessage'})); }
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
    $('.error', form).hide();
    $('input[type!="submit"]', form).val('');
}

function initBinds()
{
    // Registration
    $('form[name="registration"]').submit(function()
    {
        return submitForm($(this), function(json, data)
            {
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
