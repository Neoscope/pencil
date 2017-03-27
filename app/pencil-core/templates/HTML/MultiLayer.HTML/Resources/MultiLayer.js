
$(document).ready(function(){

    $("#DocumentInformation").show();
    $("#pages").hide();
    $(".Page").hide();

    $(".PageLink").click(function(){
        var targetPageId = $(this).data("targetpage");
        $(".Page").hide();
        $("#"+targetPageId).show();
    });

    $("#DocumentInformation").click(function(){
        $("#DocumentInformation").hide();
        $("#Pages").show();
        $(".Page").first().show();
    });

    $("footer").click(function(){
        $("#DocumentInformation").show();
        $("#Pages").hide();
        $(".Page").hide();
    });

    $(function(){
        $("#DocumentInformation").hide();
        $("#Pages").show();
        $(".Page").first().show();
    });
});
