$(document).ready(function(){
    slide("#sliding-navigation", 25, 15, 150, .8);
});

function slide(navigation_id, pad_out, pad_in, time, multiplier){
    // creates the target paths
    var list_elements = navigation_id + " li.sliding-element";
    var link_elements = list_elements + " .content-caller";

    // initiates the timer used for the sliding animation
    var timer = 0;

    // creates the slide animation for all list elements
    $(list_elements).each(function(){
        // updates timer
        timer = (timer * multiplier + time);
        // margin left = - ([width of element] + [total vertical padding of element])
        $(this).css("margin-left","-180px")
            .animate({ marginLeft: "0" }, timer)
            .animate({ marginLeft: "15px" }, timer)
            .animate({ marginLeft: "0" }, timer);
    });

    // creates the hover-slide effect for all link elements
    $(link_elements).each(function(){
        $(this).hover(function(){
            $(this).animate({ paddingLeft: pad_out }, 150);
        },
        function(){
            $(this).animate({ paddingLeft: pad_in }, 150);
        });
    });
}
