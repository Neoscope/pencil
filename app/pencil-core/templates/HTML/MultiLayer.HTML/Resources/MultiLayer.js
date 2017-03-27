
$(document).ready(function(){

    $("#DocumentInformation").show();
    $("#pages").hide();
    $(".Page").hide();

    $(".PageLink").click(function(){
        var targetPageId = $(this).data("targetpage");
        $(this).hide();
        $("#"+targetPageId).show();
    });

   $(function () {
        $("#DocumentInformation").hide();
        $("#Pages").show();
        $(".Page").first().show();
    });

});
