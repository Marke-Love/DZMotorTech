function sign_out(){
	if($.cookie("usermail").length > 0){
		if(confirm(convertLanguage("customer_confirm_logout","Whether to quit?"))){		   
			$.cookie("usermail","", { expires: -1 });
			window.location.href="/login";
		}
	}
} 

var imgNumber = 0;
var heights,imgHeight,imgLength
function size_images() {
	heights = $('.preview_pic_ul li').height() * 4 + 40;
	$('.preview_pic').height(heights)
	imgHeight = $('.preview_pic_ul li:eq(0)').height() + 10;
	imgLength = $('.preview_pic_ul li').length * imgHeight;
	$('.preview_pic_ul').css({
		"transform": "translate3d(0px," + imgNumber * imgHeight + "px, 0px)"
	})
}
$(function(){
	$("body[data-template='index'] .home_custom_design > #gallery-a_1 .bd li img,body[data-template='index'] .home_custom_design > #gallery_1 .bd li img").each(function(index, element) {
		var src= "";
		if($(this).attr("_src")){
			src = $(this).attr("_src");
		}else{
			src = $(this).attr("src");
		}
		//$(this).parent().css("background-image","url(" + src + ")");
	});
	
    $(window).resize(function() {
		size_images()
	})
    size_images()
    $('.lefts').click(function() {
      $('.rights').removeClass('on')
      if(imgNumber * imgHeight == 0) {
          $('.lefts').addClass('on')
      } else {
          $('.lefts').removeClass('on')
          imgNumber = imgNumber + 1;
          if(imgNumber * imgHeight == 0) {
              $('.lefts').addClass('on')
          }
      }
      $('.preview_pic_ul').css({
          "transform": "translate3d(0px," + imgNumber * imgHeight + "px, 0px)"
      })
    })
    $('.rights').click(function() {
        $('.lefts').removeClass('on')
        if(imgNumber * imgHeight + -heights == -imgLength) {
            $('.rights').addClass('on')
        } else {
            $('.rights').removeClass('on')
            imgNumber = imgNumber - 1;
            if(imgNumber * imgHeight + -heights == -imgLength) {
                $('.rights').addClass('on')
            }
        }
        $('.preview_pic_ul').css({
            "transform": "translate3d(0px," + imgNumber * imgHeight + "px, 0px)"
        })
  	})
 
	$('#sidebar-main-trigger').click(function(){
		if($(this).hasClass('on')){
			$(this).removeClass('on')
			$('#sidebar-main').removeClass('on')
			$('.nav_sidebar').removeClass('on')
			$('body').css('overflow','auto')
			$('.click_more').removeClass('on')
		}else{
			$(this).addClass('on')
			$('#sidebar-main').addClass('on')
			$('.nav_sidebar').addClass('on')
			$('body').css('overflow','hidden')
		}
	})
	$('.nav_sidebar').click(function(){
		$('#sidebar-main-trigger').removeClass('on')
		$('#sidebar-main').removeClass('on')
		$('.nav_sidebar').removeClass('on')
		$('body').css('overflow','auto')
		$('.click_more').removeClass('on')
	})
	$('.click_more').click(function(){
		$(this).addClass('on')
	})
	$('.click_back').click(function(event){
		event.stopPropagation();
		$(this).parents('.click_more').removeClass('on')
	})

	$('.second_level').click(function(){
		if($(this).hasClass("on")){
			$(this).removeClass("on");
			$(this).siblings(".third_nav").slideUp();
		}else{
			$(this).addClass("on");
			$(this).siblings(".third_nav").slideDown();
			
		}
	})
	$('.search_icon').click(function(){
		$('#default_search_box').show()
	})
	$('#search_close').click(function(){
		$('#default_search_box').hide()
	})
	$('.btns.search_btn').click(function(){
		$('.resp_search_box').addClass('on')
		$('#sidebar-main-trigger').removeClass('on')
		$('#sidebar-main').removeClass('on')
		$('.nav_sidebar').removeClass('on')
		$('body').css('overflow','auto')
		$('.click_more').removeClass('on')
	})
	$('.close_btn').click(function(){
		$('.resp_search_box').removeClass('on')
	})
	$('.ft_icon').click(function(){
		if($(this).hasClass('on')){
			$(this).removeClass('on')
			$(this).siblings('.footer_sub_nav').hide()
		}else{
			$(this).addClass('on')
			$(this).siblings('.footer_sub_nav').show()
		}
		
	})



	$('.ul_list_toggle').click(function(){
		var review_cate_head = $(this).closest('.review_cate_head');
		if (!review_cate_head.hasClass('active')){
			$('.ul_list_on').slideUp('400');
			review_cate_head.addClass('active');
		}else{
			$('.ul_list_on').slideDown('400');
			review_cate_head.removeClass('active');
		}
	});

	$('.nav_left_model').on('show.bs.modal',function(){
		$('html,body').addClass('show_modal_nav');

	}).on('hide.bs.modal',function(){
		$("html,body").removeClass("show_modal_nav");
	})

	$(window).on('scroll load',function(){
		var winTop = $(this).scrollTop();
		if (winTop >= 400) {
			$('.to_top').addClass('on');
		}else {
			$('.to_top').removeClass('on');
		}
	});
	$('.to_top').click(function(){
		if ($(this).hasClass('on')) {
			$('html body').animate({scrollTop: 0}, 500);
		}
	})

	$('.desc_tt').click(function() {
		if (!$(this).closest('.product_desc').hasClass('actived')) {
			$(this).next('.desc_con').slideDown();
			$(this).closest('.product_desc').addClass('actived');
			$(this).closest('.product_desc').siblings().removeClass('actived');
			$(this).closest('.product_desc').siblings().find('.desc_con').slideUp();
		}else{
			$(this).next('.desc_con').slideUp();
			$(this).closest('.product_desc').removeClass('actived');
		}
	});
	var w;
	$(window).on('resize load',function(){
		w = $(this).width();
	})

	$(window).on('scroll load',function(){
		var top = $(this).scrollTop();
		var headH = $('.header_section').outerHeight();
		if (w && w >= 992 && top > 36) {
			$('.header_section').addClass('fixed_head');
		}else {
			$('.header_section').removeClass('fixed_head');
		}
	})

	$('.pc_search_box').click(function(e) {
		e.stopPropagation();
	});
})
 window.onload = function() {
	$(".rating-stars").addClass("rating");
 }
/* zbl-add */
function GetInquiryCartDetail() {
    $.ajax({
        type: "POST",
        url: "/Submit/AjaxInquiryRequest.ashx?cmd=GetInquiryCartDetail",
        async: false,
        dataType: "json",
        success: function (data, textStatus) {
            console.log(data)
            if (data != null) {
                init_inquiry_model(data)
            }
        },
        error: function () { }
    });
}
function init_inquiry_model(data) {
    $(".pc_inquiry_list ul").empty();
    if (data.PT > 0) {
        for (item of data.ICI) {
            add_product(item)
        }


        $(".removeSp").each(function(){
            var val = $(this).text();
            var val_arr = val.split(":");
            if(val_arr[1] == "") {
                $(this).addClass("hide")
            }
            console.log(val);
        })


    }
    $(".inqcount1").text(data.PT)
}
function DeleteInquiryItems(skuid, productid) {
    var $deleteNode = $(".pc_inquiry_list ul").find(".product_inquiry[data-skuid='" + skuid + "'][data-id='" + prodcutid + "']");


    $.post("/Submit/AjaxInquiryRequest.ashx?cmd=InquiryCartRemoveItem", {
        sku_id: skuid, productid: productid
    }, function (data) {
        data = $.parseJSON(data);
        if (data.success == true) {


            $deleteNode.parentsUntil('.pc_inquiry_list ul').remove();
            GetInquiryCartDetail();
        }
    })
}
$(".numinquiry_n").click(function () {
    var num = $(this).siblings("#txtinquiry_num").val()
    if (num > 1) {
        $("#txtinquiry_num").val(--num)
    }


})
$(".numinquiry_y").click(function () {
    var num = $(this).siblings("#txtinquiry_num").val()
    $("#txtinquiry_num").val(++num)
})


$(function() {
	$(".preview_pic li").click(function() {
		let previewIndex = $(this).data("nums")
		let previewLi = $(".main_pic li").eq(previewIndex)
		let previewImage = previewLi.find(".products_img img")
		if (previewImage.length > 0) {
			$(".control_mask").addClass("products_enlarge_mask")
		} else {
			$(".control_mask").removeClass("products_enlarge_mask")
		}
	})

	$(".products_enlarge, .products_enlarge_mask").click(function() {
		let galleryIndex = $(".pagestate>span, .pageState_bk .pageState_on>span, .pageState_bk .pageState > span").text()
		galleryIndex = galleryIndex - 1;
		let totalNums = $(".main_pic li").length;
		handleSwiperInitial(galleryIndex, totalNums)
	})

	$(".enlarged-view-close").click(function() {
		$(".swiper-enlarged-view-wrapper").css({
			"display": "none"
		})
	})
})

window.onload = function() {
	$(window).resize(function() {
		let mainPicWidth = $(".main_pic li").eq(0).width()
		let mainPicHeight = $(".main_pic li").eq(0).height()
		$(".control_mask.products_enlarge_mask").css({
			"width": mainPicWidth + 'px',
			"height": mainPicHeight + 'px'
		})
	})

	$(".preview_pic li").click(function() {
		let previewIndex = $(this).data("nums")
		let previewLi = $(".main_pic li").eq(previewIndex)
		let previewImage = previewLi.find(".products_img img")
		if (previewImage.length > 0) {
			$(".control_mask").addClass("products_enlarge_mask")
		} else {
			$(".control_mask").removeClass("products_enlarge_mask")
		}
	})

}

function handleSwiperInitial(pos, total) {
	let galleryThumbs = new Swiper('.swiper-thumbs-wrapper', {
		initialSlide: pos,
		spaceBetween: 10,
		slidesPerView: 4,
		freeMode: true,
		watchSlidesVisibility: true,
		watchSlidesProgress: true,
	});
	let galleryTop = new Swiper('.swiper-large-wrapper', {
		initialSlide: pos,
		spaceBetween: 10,
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev',
		},
		thumbs: {
			swiper: galleryThumbs
		},
		on: {
			init: function () {
				updateIndexDisplay(this,total);
			},
			slideChange: function () {
				updateIndexDisplay(this,total);
			},
		},
	});
	$(".swiper-enlarged-view-wrapper").css({
		"display": "flex"
	})
}

function updateIndexDisplay(swiper, total) {
	let totalSlides = swiper.slides.length;
	let currentIndex = swiper.activeIndex;
	$(".pswp__counter").text((currentIndex+1) + " / " + total)
}