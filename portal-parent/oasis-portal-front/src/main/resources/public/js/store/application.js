$(document).ready(function() {


    $(".btn-indicator-available").popover({
        content: $("div#install-app-popover").html(),
        html:true,
        placement:'bottom',
        trigger:'click'
    });


});