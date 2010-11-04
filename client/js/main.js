var sections; // descriptions of toplevel sections (which behave like pages)
var session; // session info, obtained from cookies

function describeSections()
{
    sections = {
        registration: {                  // key for anchor
            body: $("#registration"),    // what section to show (maybe move in 'show')
            hide: [$("#menu")],          // elements to hide
            show: [],                    // elements to show
            init: function() {}          // actions to perform after showing
        },
        main: {
            body: $('#main'),
            show: [$('#menu')],
            hide: [],
            init: function()
            {
                $("#menu #sign-out").click(function()
                {
                    getJSON(
                        addSid({ cmd: "unregister" }),
                        function(json) { showSection("registration"); }
                    );
                });
            }
        }
    }
}

function showSection(section_name)
{
    if(getCurrentSection() == section_name)
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
    section.body.show();
    $.each(section.show, function(i, v) { v.show(); });
    $.each(section.hide, function(i, v) { v.hide(); });
    section.init();
}

function initNavigation()
{
    var items = $("nav > p");

    $(".main-section").hide();
    items.click(function()
    {
        var item = $(this);
        if (item.hasClass("nav-current")) return;

        $(".main-section").hide();
        target_id = item.text().toLowerCase().replace(" ", "-");
        $(".main-section[id=" + target_id +"]").show();

        $.each(items, function() { $(this).removeClass("nav-current"); });
        item.addClass("nav-current");
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

function getCommand(form)
{
    commands = {
        registration: { cmd: "register" }
    }
    return commands[form.attr("name")]
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

$(document).ready(function()
{
    globalAjaxCursorChange();
    initNavigation();

    describeSections();
    window.onhashchange = innerShowSection;

    if(!showSection(getCurrentSection() || "registration"))
    {
        innerShowSection(); // force redraw to avoid artifacts
    }

    $("form").submit(function()
    {
        var form = $(this);
        var data = grabForm(form);
        var command = getCommand(form);

        $(".error", form).hide();

        getJSON(
            $.extend(data, command),
            function (json)
            {
                session = setCookie("session",
                    {
                        sid: json.sid,
                        username: data.username
                    }
                );
                showSection("main");
            },
            function (message) { formError(form, message); }
        );

        return false; // ban POST requests
    });
});
