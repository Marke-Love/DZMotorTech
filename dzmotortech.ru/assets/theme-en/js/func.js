$(document).ready(function(){
    $("#input-id").rating();
    $('.swipebox').swipebox();
    //productshow_list($(".productshow_list:eq(1)"),"2");
    productshow_list($(".productshow_list:eq(0)"),"1");
})
function productshow_list(obj,index){
    var autoPlay = true,titCell = ".hd_" + index,mainCell=".bd_" + index;
    $(obj).attr("id","productshow_list_" + index );
    $(obj).find(" > .hd").addClass("hd_" + index);
    $(obj).find(" > .bd").addClass("bd_" + index);
    $(obj).find(" > .sPrev").addClass("sPrev_" + index);
    $(obj).find(" > .sNext").addClass("sNext_" + index);
    if($(obj).attr("data-autoPlay") == "false"){
        autoPlay = false;
    }
    if($(obj).attr("data-titCell")){
        titCell = titCell + " " + $(obj).attr("data-titcell");
    }
    if($(obj).attr("data-mainCell")){
        mainCell = mainCell + " " + $(obj).attr("data-mainCell");
    }
    TouchSlide({
        slideCell:"#productshow_list_" + index,
        titCell:titCell,
        mainCell:mainCell,
        effect:"left",
        autoPage:autoPlay,
        pnLoop:"true",
        prevCell:".sPrev_" + index,
        nextCell:".sNext_" + index,
        pageStateCell:"#productshow_list_"+ index +" .pagestate",
        switchLoad:"_src"
    });
}