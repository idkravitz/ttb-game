var descr;          // descriptions of toplevel sections (which behave like pages)

function activate(descr){
    $("#content > section").hide();
    descr.section.show();
    $.each(descr.show, function(i, v) { v.show(); });
    $.each(descr.hide, function(i, v) { v.hide(); });
    descr.init();
}

$(document).ready(function(){
    window.onhashchange = function(){          // We have a new browser only
        hash = window.location.hash.substr(1); // remove # symbol
        if(hash && hash in descr){
            activate(descr[hash]);                
        }
        else{
            window.location.hash = 'registration';
        }
    };
    $('.content-caller').click(function() {
        $(".section-nav-result").hide();
        $("div.section-nav-result[id^=content" + $(this).attr('name') + "]").show();
    });

    descr = {
        registration: {                         // key for anchor
            section: $('#registration'),        // what section to show (maybe move in 'show')
            hide: [$("#menu-wrapper")],         // elements to hide
            show: [],                           // elements to show
            init: function() {                  // actions to perform after showing
            }
        },
        main: {
            section: $('#main'),
            show: [$('#menu-wrapper')],
            hide: [],
            init: function() {
                $('#menu').html($('#main > .menu-content').html());
            }
        },
        lobby: {
            section: $('#lobby'),
            show: [$('#menu-wrapper')],
            hide: [],
            init: function() {
                $('#menu').html($('#lobby > .menu-content').html());
            }
        }
    };

    window.onhashchange();        // adjust page by anchor

    $("#contentAbout").show();
    $("form[name='register']").submit(function(obj){
        $.ajax({url:'/',
            data:{
                cmd: "register",
                username: $("input[name='name']", this).val(),
                password: $("input[name='password']", this).val()
            },
            success: function(text){
                if (text.status != 'ok'){
                    var active_element, message = text.message;
                    $("#username_error, #password_error").fadeOut(500);
                    active_element = /.*username.*/i.test(message)
                        ? $("#username_error") : $("#password_error");
                    active_element.fadeIn(500);
                    $('span', active_element).text(message);
                }
                else{
                    window.location.hash = 'main';
                }
            }, 
            dataType: 'json',
            type: 'POST',
            async: false
        });
        return false;       // don't allow form to send POST requests
    });

    $("form[name='lobby']").submit(function(obj){
        // do some ajax
        window.location.hash = 'lobby';
        return false;
    });
});
