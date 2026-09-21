// JavaScript Document
custom_products();
$(document).ready(function(){
	$(window).resize(function(){
		   custom_products();
	});
	$(".modal_gallery_slide").each(function(index, element) {
		$(this).attr("id","modal_gallery_"+ index);
		var data = { 
			slideCell:"#modal_gallery_" + index,
			titCell:".hd ul",
			mainCell:".bd ul", 
			effect:"leftLoop",
			delayTime:"1000",
			interTime:"8000",
			autoHover:true,
			autoPlay:true,
			autoPage:true,
			pageStateCell:"#modal_gallery_" + index + " .pageState",
			switchLoad:"_src",
		}
		if(typeof TouchSlideData == "object"){
			if(TouchSlideData["slideCell"]){
				if(TouchSlideData["slideCell"] == data["slideCell"]){
					delete TouchSlideData["slideCell"];
					data =  $.extend(data , TouchSlideData);
				}
			}else{
				data =  $.extend(data , TouchSlideData);
			}
		}
		TouchSlide(data);
	});
	$(".modal_gallery_a_slide").each(function(index, element) {
		$(this).attr("id","modal_gallery_a_"+ index);
		var $obj = $(this);
		TouchSlide({ 
			slideCell:"#modal_gallery_a_" + index,
			titCell:".hd ul",
			mainCell:".bd ul", 
			effect:"leftLoop",
			delayTime:"1000",
			interTime:"8000",
			autoHover:true,
			autoPlay:true,
			autoPage:true,
			switchLoad:"_src",
			pageStateCell:"#modal_gallery_a_" + index + " .pageState",
			endFun:function(i,c){
				$obj.find(" .bd ul li").eq(i + 1).addClass("on").siblings().removeClass("on");
			}
		});
		$obj.on("click",".li_prev",function(){
			$obj.find(".prev").click();
		}).on("click",".li_next",function(){
			$obj.find(".next").click();
		})
	})
	
	$(".play_products_modal_slide").each(function(index, element) {
		$(this).attr("id","play_products_modal_"+ index);
		TouchSlide({ 
			slideCell:"#play_products_modal_" + index,
			titCell:".hd ul",
			effect:"left",
			autoPage:true,
			pnLoop:"true",
			switchLoad:"_src",
			pageStateCell:"#play_products_modal_" + index + " .pageState",
		});
	});
})
function custom_products(){
	$(".custom_products").each(function(index, element) {
		var $categoryimg = $(this).find(".categoryimg");
		$(this).find(".categoryimg").height($categoryimg.next().height());
	});
}