var sections; // descriptions of toplevel sections (which behave like pages)

function describeSections()
{
    sections = {
        registration: {                  // key for anchor
            body: $("#registration"),    // what section to show (maybe move in 'show')
            hide: [$("#menu-wrapper")],  // elements to hide
            show: [],                    // elements to show
            init: function() {}          // actions to perform after showing
        },
        main: {
            body: $('#main'),
            show: [$('#menu-wrapper')],
            hide: [],
            init: function() {}
        }
    }
}

function showSection(section_name)
{
    window.location.hash = section_name;
}

function innerShowSection()
{
    var section_name = window.location.hash.substr(1); // remove # symbol
    if (!section_name || !(section_name in sections))
    {
        section_name = "registration";
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
        $(".main-section").hide();
        target_id = $(this).text().toLowerCase().replace(" ", "-");
        $(".main-section[id=" + target_id +"]").show();
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
        '/ajax',
        { data: JSON.stringify(data) },
        function (json)
        {
            if (json.status == 'ok')
                handler(json);
            else
            {
                if (error_handler == null)
                    error_handler = alert;
                error_handler(json.message);
            }
        }
    );
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

$(document).ready(function()
{
    globalAjaxCursorChange();
    initNavigation();

    describeSections();
    window.onhashchange = innerShowSection;
    showSection("registration");

    $("form").submit(function()
    {
        var form = $(this);
        var data = grabForm(form);
        
        var command = "";
        
        if (form.attr("name") == "registration")
        {
            var command = { cmd: "register" };
        }
        
        $(".error", form).hide();

        getJSON(
            $.extend(data, command),
            function (json)
            { 
                sid = json.sid;
                showSection("main");
            },
            function (message) { formError(form, message); }
        );
        
        return false; // ban POST requests
    });
});
