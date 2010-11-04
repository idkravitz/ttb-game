var sections; // descriptions of toplevel sections (which behave like pages)
var session;  // session info, obtained from cookies

function describeSections()
{
    sections = {
        'registration': {                      // key for anchor
            body: $("#registration"),          // what section to show (maybe move in 'show')
            hide: [$("#menu"), $("nav")],      // elements to hide
            show: [],                          // elements to show
            init: initRegistration             // actions to perform after showing
        },
        'about': {
            body: $('#about'),
            hide: [],
            show: [$('#menu'), $("nav")],
            init: function() {}
        },
        'active-games': {
            body: $('#active-games'),
            hide: [],
            show: [$('#menu'), $("nav")],
            init: initActiveGames,
        },
        'create-game': {
            body: $('#create-game'),
            hide: [],
            show: [$('#menu'), $("nav")],
            init: initCreateGame,
        },
        'upload-army': {
            body: $('#upload-army'),
            hide: [],
            show: [$('#menu'), $("nav")],
            init: function() {}
        }
    }
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

        showSection(item.text().toLowerCase().replace(" ", "-"));
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
    $("#menu #sign-out").click(function()
    {
        getJSON(
            addSid({ cmd: "unregister" }),
            function(json) { showSection("registration"); }
        );
    });
}

function initRegistration()
{
    $('form[name="registration"]').submit(function()
    {
        return submitForm(
            $(this),
            function(json, data)
            {
                session = setCookie(
                    'session', { sid: json.sid, username: data.username });
                showSection("active-games");
            }
        );
    });
}

function initActiveGames()
{

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
                for (i = 0; i < json[array].length; ++i)
                {
                    select.append(
                       $('<option value="' + i + '">' + json[array][i][attr] + '</option>'));
                }
            }
        );
    }
    updateSelect('getMapList', 'map');
    updateSelect('getFactionList', 'faction');

    $('form[name="creation"]').submit(function()
    {
        return submitForm($(this), function() { showSection("lobby"); });
    });
}

function getJSON(data, handler, error_handler)
{
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
}

function addSid(data)
{
    return $.extend(data, { sid: session.sid });
}

function globalAjaxCursorChange()
{
    $("html").bind("ajaxStart", function()
    {
        $(this).addClass('busy');
    }).bind("ajaxStop", function()
    {
        $(this).removeClass('busy');
    });
}

function grabForm(form)
{
    var obj = {};
    $("input[type!='submit']", form).each(function(i, v)
    {
        obj[$(v).attr('name')] = $(v).attr('rel') == 'int' ? parseInt($(v).val()) : $(v).val();
    });
    $("select", form).each(function(i, v)
    {
        obj[$(v).attr('name')] = $(':selected', v).text();
    });
    return obj;
}

function formError(form, text)
{
    form.prepend('<p class="error ui-corner-all">' + '<img src="/images/error.png">' + text + '</p>');
}

function setCookie(name, data)
{
    $.cookie(name, JSON.stringify(data));
    return data;
}

function readCookie(name)
{
    return JSON.parse($.cookie(name));
}

function submitForm(form, handler)
{
    var data = grabForm(form);
    var commands = {
        registration: function () { return { cmd: 'register' }; },
        creation: function () { return addSid({ cmd: 'createGame' }); }
    }

    alert(JSON.stringify($.extend(data, commands[form.attr('name')]())));
    getJSON(
        $.extend(data, commands[form.attr('name')]()),
        function (json) { handler(json, data); },
        function (message) { formError(form, message); }
    );

    $('.error', form).hide();
    return false; // ban POST requests
}

$(document).ready(function()
{
    globalAjaxCursorChange();
    initNavigation();
    initHorzMenu();

    describeSections();
    window.onhashchange = innerShowSection;

    if (!showSection(getCurrentSection() || "registration"))
    {
        innerShowSection(); // force redraw to avoid artifacts
    }
});
