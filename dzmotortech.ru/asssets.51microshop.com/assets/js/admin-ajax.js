var usetiktokpixelapi;
var basepath = '';
(function ($) {
    if (/^(\/[a-z]{2}(-[a-z]{2})?\/)|(\/[a-z]{2}(-[a-z]{2})?$)/i.test(location.pathname)) {
        basepath = '/' + location.pathname.split('/')[1];
    }
    window.addEventListener('message', function (event) {
        if (event.data.action === 'scrollTo') {
            $('section.section [data-tag],.footer_b,.pc_logo').removeAttr('style');
            if (event.data.elementId == "sitelogo" || event.data.elementId == "copyright") {
                if (event.data.elementId == "sitelogo") {
                    $('.pc_logo').css('border', '2px solid red')
                    $('body,html').animate({
                        scrollTop: 0
                    }, 500);
                }
                else {
                    $('.footer_b').css('border', '2px solid red')
                    $('body,html').animate({
                        scrollTop: $('body').height()
                    }, 500);
                }
            } else {
                var element = document.getElementById(event.data.elementId);
                if (!element)
                    element = document.getElementById(event.data.elementId.replace(/\d+$/, 0));
                if (element) {
                    element.style = "border: 2px solid red;"
                    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                }
            }
        }
        if (event.data.action === 'remove') {
            var element = document.getElementById(event.data.elementId);
            if (!element)
                element = document.getElementById(event.data.elementId.replace(/\d+$/, 0));
            if (element) {
                if ($(element).next().length == 0)
                    element.remove();
                else {
                    var index = event.data.elementId.match(/\d+$/)[0];
                    for (var i = $('[data-tag]').length - 1; i >= index; i--) {
                        $($('section.section [data-tag]')[i]).attr("id", $($('[data-tag]')[i]).attr("data-tag") + "_" + i);
                    }
                    $($("section.section [data-tag]")[index - 1]).remove();
                }
            }
        }
        if (event.data.action === 'removeborder') {
            $('section.section [data-tag]').removeAttr('style');
        }
    });
    if (location.href.split('#').length > 1) {
        var element = document.getElementById(location.href.split('#')[1]);
        if (!element)
            element = document.getElementById(location.href.split('#')[1].replace(/\d+$/, 0));
        if (element) {
            setTimeout(function () {
                // Красную рамку рисовал редактор старой платформы, чтобы подсветить
                // редактируемый блок. На живом сайте она не нужна — оставляем только
                // плавную прокрутку к якорю.
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }, 350);
        }
    }
    setCartValueExp();
    $.extend({
        tipsBox: function (options) {
            options = $.extend({
                obj: null,
                str: "+1",
                startSize: "12px",
                endSize: "30px",
                interval: 600,
                color: "red",
                callback: function () {
                }
            }, options);
            $("body").append("<span class='num'>" + options.str + "</span>");
            var box = $(".num");
            var left = options.obj.offset().left + options.obj.width() / 2;
            var top = options.obj.offset().top - options.obj.height();
            box.css({
                "position": "absolute",
                "left": left + "px",
                "top": top + "px",
                "z-index": 9999,
                "font-size": options.startSize,
                "line-height": options.endSize,
                "color": options.color
            });
            box.animate({
                "font-size": options.endSize,
                "opacity": "0",
                "top": top - parseInt(options.endSize) + "px"
            }, options.interval, function () {
                box.remove();
                options.callback();
            });
        }
    });
    $('.itemLabel').css('width', 'auto');
    $('.itemLabel').width($('.itemLabel').width());
    $('body').on('click', '[data-target=".cart_model"]', function () {
        setTimeout(function () {
            $('.pc_cart_list>ul').css("bottom", document.querySelector('.pc_cart_foot').offsetHeight);
            $('.itemLabel').css('width', 'auto');
            $('.itemLabel').width($('.itemLabel').width())
        }, 500);
    });
    if (typeof(chectoutpage) != "undefined" && chectoutpage == "/checkoutnew") {
        $('#paypal-button-container-cart,#paypal-button-container-sidecart,#paypal-button-container-sidecart1,#paypal-button-container-sidecart2,#stripe-button-container-cart,#stripe-button-container-sidecart,#stripe-button-container-sidecart1').before(`<div class="smart-button-cart-container_mask" style="position: absolute;z-index: 10001;background-color: rgb(243, 243, 243);opacity: 0.5;width: 100%;height: 100%;display: block;top:0px"></div>`);
        $('#stripe-button-container-cart,#stripe-button-container-sidecart,#stripe-button-container-sidecart1').parent().css('position', ' relative')
        ajax_lodding();
    }
})(jQuery);

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

function guid() {
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function guidnew() {
    return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
}

function getDomain() {
    var domain = "";
    if (location.host.toLowerCase().startsWith("www.")) {
        domain = location.host.substring(4);
    } else {
        domain = location.host;
    }
    return domain;
}

var modal_vertical_middle = function () {
    $(this).css('display', 'block');
    $(this).find('.modal-dialog').css({
        'margin-top': Math.max(20, ($(window).height() - $(this).find('.modal-dialog').height()) / 2)
    });
}

$(document).ready(function () {
    $(".cart_list,.pc_cart_list,[name='checkoutForm']").on("click", ".cart_td_qty i", function () {
        var $obj = $(this).siblings("input");
        var suns = parseInt($obj.val());
        if (isNaN(suns)) {
            suns = 1;
        }
        if ($(this).hasClass("num_n")) {
            suns = suns - 1;
        } else {
            var obj_max = suns + 1;
            if ($obj.attr("max") >= obj_max) {
                suns = suns + 1;
            } else {
                suns = $obj.attr("max");
            }
        }
        $obj.val(suns);
        if (!$(this).parent().data("customize")) {
            if (suns <= 0) {
                CartRemoveItem($(this).parent().data("sku"), $(this).parent().data("id"), $(this).parent().data("optionsskuid"), "0");
            } else {
                UpdateCartItem($(this).parent().data("sku"), $(this).parent().data("id"), $(this).parent().data("optionsskuid"), suns);
            }
        } else {
            $obj.change();
        }
    })
    cart_input();
    $("body").on("show.bs.modal", ".modal[data-vertical=middle]", function () {
        modal_vertical_middle.apply(this);
    });
    $("body").on('hidden.bs.modal', ".modal", function (e) {
        if ($(".modal.in").length > 0) {
            $("body").addClass("modal-open");
        }
    });
    $(window).resize(function () {
        if ($(".modal.in[data-vertical=middle]").length > 0) {
            modal_vertical_middle.apply($(".modal.in[data-vertical=middle]"));
        }
    });
    $(".search_submit[onsubmit*=searchForm]").each(function (index, element) {
        var $obj = $(this);
        $(this).find($(this).data("btn")).click(function () {
            $obj.submit();
        })
    });
    // Запрос числа товаров в корзине убран: корзины на сайте нет,
    // обработчик /Submit/ajaxrequest.ashx отсутствует и отвечал ошибкой.

});

function convertLanguage(key, value) {
    return Shopify["languagejson"][key] || value || "";
}

function CancelOrders(id) {
    $('#CancelOrders').attr("disabled", "disabled");
    $.get("/Submit/ajaxrequest.ashx?cmd=CannelOrder&orderid=" + id,
        function (data) {
            data = eval('(' + data + ')');
            if (data.success) {
                location.href = basepath + "/member";
            } else {
                $('#CancelOrders').attr("disabled", null);
                alert(convertLanguage("general_cancel_failed", "Cancel failed!"));
            }
        }
    );
}

function cart_input() {
    $(".cart_td_qty input").keyup(function () {
        var max_val = parseInt($(this).attr("max"));
        var this_val = parseInt($(this).val());
        if (isNaN(this_val)) {
            this_val = 1;
        }
        if (max_val < this_val) {
            $(this).val(max_val);
        } else {
            $(this).val(this_val);
            if (!$(this).parent().data("customize")) {
                if (this_val <= 0) {
                    CartRemoveItem($(this).parent().data("sku"), $(this).parent().data("id"), $(this).parent().data("optionsskuid"), "0");
                } else {
                    UpdateCartItem($(this).parent().data("sku"), $(this).parent().data("id"), $(this).parent().data("optionsskuid"), $(this).val());
                }
            }
        }

    })
}

function ordersurl() {
    var checkouturl;
    _orderGuid = guid();
    try {
        checkouturl = chectoutpage + "?orderGuid=" + _orderGuid;
    } catch (e) {
        checkouturl = "/checkout";
    }
    if (typeof(chectoutpage)!="undefined" && chectoutpage == '/checkoutnew') {
        var selectItems = [];
        var enableSelectCheckout = 0;
        var allLength = 0;
        if ($('[name="ckb_cartitem"]').length != 0) {
            enableSelectCheckout = 1;
            if ($('.cart_list').length != 0) {
                $.each($('.cart_list [name="ckb_cartitem"]:checked'), function name(params) {
                    selectItems.push($(this).data())
                })
                allLength = $('.cart_list [name="ckb_cartitem"]').length;
            }
            else {
                $.each($('.pc_cart_list [name="ckb_cartitem"]:checked'), function name(params) {
                    selectItems.push($(this).data())
                })
                allLength = $('.pc_cart_list [name="ckb_cartitem"]').length;
            }
        }
        if (enableSelectCheckout) {
            if (selectItems.length == 0) {
                alert(convertLanguage("general_select_item_to_checkout", "Please select items to checkout!"));
                return;
            }
            else {
                if (allLength != selectItems.length) {
                    $.ajax({
                        type: "POST",
                        url: "/Submit/ajaxrequest.ashx?cmd=SetShopCartCheckoutOfSelectedItems",
                        async: false,
                        dataType: 'json',
                        data: { orderGuid: _orderGuid, checkeditems: JSON.stringify(selectItems) },
                        beforeSend: function (XMLHttpRequest) {
                        },
                        success: function (data, textStatus) {
                            //setSingleProductCheckOutOptionResult = data.result;
                        },
                        complete: function (XMLHttpRequest, textStatus) {
                        },
                        error: function () {
                        }
                    });
                }
            }
        }
    }
    if ($.cookie("buystatus") == "Y" || $.cookie("usermail") != null) {
        window.location.href = checkouturl;
    } else {
        window.location.href = basepath + "/login?url=" + encodeURIComponent(checkouturl);
    }
}

function CartRemoveItem(sku, prodcutid, OptionsSkuId, index) {
    if (/^\d+$/.test(OptionsSkuId))
        OptionsSkuId = "";
    else
        OptionsSkuId = ((OptionsSkuId == null || OptionsSkuId == 'null' || OptionsSkuId == '') ? "" : escape(texttohtml(OptionsSkuId)).replace(/\+/g, '%2B').replace('%D7', '%c3%97'));
    $.ajax({
        type: "POST",
        url: "/Submit/ajaxrequest.ashx?cmd=CartRemoveItem&sku_id=" + escape(texttohtml(sku)).replace(/\+/g, '%2B').replace('%D7', '%c3%97') + "&prodcutid=" + prodcutid + "&optionsSkuId=" + OptionsSkuId,
        beforeSend: function (XMLHttpRequest) {
        },
        success: function (data, textStatus) {
            //var cartvalue = JSON.parse($.cookie("cartvalue"));
            setCartValueExp();
            if (data == "True") {
                ajax_lodding();
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
}

function UpdateCartItem(sku, prodcutid, OptionsSkuId, num) {
    if (/^\d+$/.test(OptionsSkuId))
        OptionsSkuId = "";
    else
        OptionsSkuId = ((OptionsSkuId == null || OptionsSkuId == 'null' || OptionsSkuId == '') ? "" : escape(texttohtml(OptionsSkuId)).replace(/\+/g, '%2B').replace('%D7', '%c3%97'));
    $.ajax({
        type: "POST",
        url: "/Submit/ajaxrequest.ashx?cmd=CartItemUpdate&sku_id=" + escape(texttohtml(sku)).replace(/\+/g, '%2B').replace('%D7', '%c3%97') + "&prodcutid=" + prodcutid + "&num=" + num + "&optionsSkuId=" + OptionsSkuId,
        beforeSend: function (XMLHttpRequest) {
        },
        success: function (data, textStatus) {
            if (data == "True") {
                setCartValueExp();
                ajax_lodding();
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
}

function getCurrency(value) {
    return Shopify.currency[0].tags + (Shopify.currency[0].rate * value).toFixed(2);
}

function PromotionsModel(data) {
    var $model = $("[data-type='PromotionsModel']").empty();
    var $Total = $("[data-type='PromotionsTotal']").empty();
    $.each(data, function (index, obj) {
        var html = "",
            $div = $('<div class="alert alert-warning" role="alert">').appendTo($model);
        $('<span><label title="' + obj.PromotionName + '">' + obj.PromotionName + ':</label><strong id="promotion_' + obj.PromotionId + '">-' + getCurrency(obj.PromotionAmount) + '</strong></span>').appendTo($Total);
        html += "<strong>";
        if (obj["Type"] == 1) {
            html += convertLanguage("general_cut_off", "[Cut OFF]");
        } else {
            html += convertLanguage("general_discount", "[Discount]");
        }
        html += " " + obj.PromotionName + ":";
        html += "</strong>";
        $.each(obj["PromotionRule"] || [], function (index, rule) {
            html += " &bull; " + convertLanguage("general_overprice", "OverPrice") + " " + getCurrency(rule.OverPrice);
            if (obj.Type == 1) {
                html += " " + convertLanguage("general_cut", "Cut") + " " + getCurrency(rule.OffDiscount) + " " + convertLanguage("general_off", "off") + ".";
            } else {
                html += " " + convertLanguage("general_take", "Take") + " " + (parseFloat(rule.OffDiscount).toFixed(2) * 100) + "% " + convertLanguage("general_off", "off") + ".";
            }
        });
        $div.html(html);
    });
}

function ajax_lodding() {
    var $lodding = $(".cart_list ul,.pc_cart_list ul").append("<div class=\"lodding\"></div>").find(".lodding"),
        $btn_buy = $(".btn_buy").addClass("btn_ajax").button('loading'),
        list_html = "",
        cartvalue,
        products;
    if (typeof (checkoutCart) == "function") {
        checkoutCart();
    }
    var selectItems = [];
    var enableSelectCheckout = 0;
    if ($('[name="ckb_cartitem"]').length != 0) {
        enableSelectCheckout = 1;
        if ($('.cart_list').length != 0) {
            $.each($('.cart_list [name="ckb_cartitem"]:checked'), function name(params) {
                selectItems.push($(this).data())
            })
        }
        else {
            $.each($('.pc_cart_list [name="ckb_cartitem"]:checked'), function name(params) {
                selectItems.push($(this).data())
            })
        }
    }
    $.ajax({
        type: "POST",
        url: "/Submit/ajaxrequest.ashx?cmd=GetShopCartDetail",
        async: false,
        dataType: "json",
        data: {
            checkitems: JSON.stringify(selectItems)
        },
        success: function (data, textStatus) {
            cartvalue = data;
            PromotionsModel(data["Promotions"] || []);
        },
        error: function () {
        }
    });

    cartvalue = cartvalue["shopCart"] || cartvalue;

    $.each(cartvalue.CI, function (index, obj) {
        var num = "",
            total_price = Shopify.currency[0].tags + "0.00",
            css_disabled = " class=\"disabled\"";
        if (obj.SO || obj.UA) {
            if (obj.SO) {
                num += "<span class=\"label label-default\">" + convertLanguage("chack_out_sold_out", "Sold out") + "</span>";
            } else if (obj.UA) {
                num += "<span class=\"label label-default\">" + convertLanguage("chack_out_unavailable", "Unavailable") + "</span>";
            }
        } else {
            num = "<div class=\"cart_td_qty\" data-sku=\"" + obj.SI + "\" data-id=\"" + obj.PI + "\" data-OptionsSkuId=\"" + obj.OptionsSkuId + "\"> <i class=\"num_n\">-</i><input value=\"" + obj.QT + "\" class=\"cart_num\" max=\"" + obj.ST + "\" type=\"text\" onblur_get=\"UpdateNum('" + obj.SI + "','" + obj.PI + "','" + obj.OptionsSkuId + "',' + index + ')\" /><i class=\"num_y\">+</i></div>";
            total_price = Shopify.currency[0].tags + (Shopify.currency[0].rate * Number(obj.QT) * Number(obj.PR)).toFixed(2);
            css_disabled = "";
        }
        let optionHtml = ''
        let originHtml = ""

        if (obj.Options && obj.Options.length > 0) {

            $(obj.Options).each(function (idx, item) {
                optionHtml += "<div class='optionDiv'>"
                optionHtml += item.html
                if (item.price > 0) {
                    optionHtml += ("<span class='optionprice'>" + getCurrency(item.price) + "</span>")
                }
                optionHtml += "</div>"
            })
        }

        if (obj.V == "" || obj.V == null) {
            originHtml = `<div class="optionDiv"><div class="itemOption" style="line-height: normal;"><a href="${obj.Url}" title="${obj.Name}">${obj.Name}</a></div>`
            if (obj.OptionsPrice != 0) {
                originHtml += ` <span class="optionprice">${getCurrency(obj.BasePrice)}</span></div>`
            } else {
                originHtml += `</div>`
            }
        } else {
            originHtml = `<a href="${obj.Url}" title="${obj.Name}">${obj.Name}</a><div class="optionDiv"><div class="itemOption"><span class="originAttr">${obj.V.replace(/卍/g, ",")}</span></div>`
            if (obj.OptionsPrice != 0) {
                originHtml += ` <span class="optionprice">${getCurrency(obj.BasePrice)}</span></div>`
            } else {
                originHtml += `</div>`
            }
        }
        var itemCheckBoxHtml = '';
        if (typeof(chectoutpage)!="undefined" && chectoutpage == "/checkoutnew" && cartvalue.ACOSIO) {
            itemCheckBoxHtml = `<input type="checkbox" name="ckb_cartitem" data-productid="${obj.PI}"  data-skuid="${obj.SI}"  data-optionsskuid="${obj.OptionsSkuId == null ? "" : obj.OptionsSkuId}"/>`
        }
        list_html += "<li id=\"cartitem_" + index + "\"" + css_disabled + "><div class=\"cp\"><div class=\"img\">" + itemCheckBoxHtml + "<a href=\"" + obj.Url + "\" title=\"" + obj.Name + "\"><img src=\"" + httpsImageOperate(obj.PicUrl) + "?x-oss-process=image/resize,w_100,q_80\" alt=\"" + obj.Name + "\"></a></div><div class=\"title\">" + originHtml + optionHtml + "" + "" + "</div> " + "" + "<div class=\"money\"><label class=\"visible-xs-inline-block\">" + convertLanguage("general_unit_price", "Unit Price:") + "</label><strong>" + getCurrency(Number(obj.PR)) + "</strong></div><div class=\"num\">" + num + "</div><div class=\"money total\"><label class=\"visible-xs-inline-block\">" + convertLanguage("general_total_price", "Total Price:") + "</label><strong>" + total_price + "</strong></div></div><div class=\"remove\"><a href=\"javascript:void(0)\" onclick=\"CartRemoveItem('" + obj.SI + "','" + obj.PI + "','" + obj.OptionsSkuId + "','" + index + "')\" title=\"" + convertLanguage("general_remove", "Remove") + "\" ><span class=\"glyphicon glyphicon-trash\"></span></a></div></li>";
    })
    $(".total_num").text(cartvalue.TN).attr("data-num", cartvalue.TN);
    $("#totalprice,.totalprice").text(Shopify.currency[0].tags + (Shopify.currency[0].rate * Number(cartvalue.TO)).toFixed(2));
    $('.cart_promotion').empty();
    for (var i = 0; i < (cartvalue.Promotions ? cartvalue.Promotions.length : 0); i++) {
        $('.cart_promotion').append(" <span><label>" + convertLanguage("cart_already_satisfied", "Already satisfied") + cartvalue.Promotions[i].PromotionName + " promotion :</label>    <strong >-" + Shopify.currency[0].tags + (Shopify.currency[0].rate * Number(cartvalue.Promotions[i].PromotionAmount)).toFixed(2) + "</strong></span>");
    }
    $lodding.animate({
        opacity: "0"
    }, 500, function () {
        if (list_html == "") {
            $(".cart_list").addClass("no_list").html("<p>" + convertLanguage("cart_empty_cart", "Your cart is currently empty.") + "</p>");
            $(".pc_cart_list").addClass("no_data").find("ul").html(list_html);
            $('.ckb_allitem').hide();
        } else {
            if (typeof(chectoutpage)!="undefined" && chectoutpage == "/checkoutnew" && cartvalue.ACOSIO) {
                $('.ckb_allitem').show();
            }
            else {
                $('.ckb_allitem').hide();
            }
            $(".pc_cart_list").removeClass("no_data");
            $(".cart_list ul,.pc_cart_list ul").html(list_html);
            if (typeof(chectoutpage)!="undefined" && chectoutpage == "/checkoutnew" && cartvalue.ACOSIO) {
                $.each(selectItems, function (index, item) {
                    $(".cart_list [name='ckb_cartitem'][data-productid='" + item.productid + "'][data-skuid='" + item.skuid + "'][data-optionsskuid='" + item.optionsskuid + "']").prop("checked", true);
                    $(".pc_cart_list [name='ckb_cartitem'][data-productid='" + item.productid + "'][data-skuid='" + item.skuid + "'][data-optionsskuid='" + item.optionsskuid + "']").prop("checked", true)
                })
            }
        }
        if (selectItems.length != cartvalue.CI.length) {
            $('.ckb_allitem').prop('checked', false);
        }
        else {
            $('.ckb_allitem').prop('checked', true);
        }
        cart_input();
        $lodding.remove();
        $btn_buy.removeClass("btn_ajax");//.button("reset");
        if (typeof(chectoutpage)!="undefined" && chectoutpage == "/checkoutnew" && cartvalue.ACOSIO) {
            if ($('.all_transition.modal_close .ckb_allitem').length == 0) {
                $(".all_transition.modal_close ").prepend('<input type="checkbox" class="ckb_allitem" />');
            }
            if ($('.cart_list .cart_th .cp .title .ckb_allitem').length == 0) {
                $('.cart_list .cart_th .cp .title').prepend('<input type="checkbox" class="ckb_allitem" />');
            }
            if ($('[name="ckb_cartitem"]:checked').length == 0) {
                $(".btn_buy").attr("disabled", "disabled");
                $(".btn_buy").addClass("disabled");
                $(".smart-button-cart-container_mask").show();
            }
            else {
                $(".btn_buy").removeAttr("disabled");
                $(".btn_buy").removeClass("disabled");
                $(".smart-button-cart-container_mask").hide();
            }
        }
        else {
            $(".smart-button-cart-container_mask").hide();
            $btn_buy.button("reset");
        }
        $('.itemLabel').css('width', 'auto');
        $('.itemLabel').width($('.itemLabel').width())
    });
    remove_total_num();
}

function likeblog(obj) {
    var obj = {
        dom: $(obj),
        url: "/Submit/ajaxrequest.ashx?cmd=LikeBlog&blogid=" + $(obj).data("id"),
        display: "+1",
        algorithm: "plus",
        parts: $(".likenumber")
    }
    top_step_on(obj);
}

function blogreviewup(obj) {
    var obj = {
        dom: $(obj),
        url: "/Submit/ajaxrequest.ashx?cmd=BlogReviewUp&reviewid=" + $(obj).data("id"),
        display: '<span class="glyphicon glyphicon-thumbs-up"></span>',
        algorithm: "plus",
        parts: null
    }
    top_step_on(obj);
}

function blogreviewdown(obj) {
    var obj = {
        dom: $(obj),
        url: "/Submit/ajaxrequest.ashx?cmd=BlogReviewDown&reviewid=" + $(obj).data("id"),
        display: '<span class="glyphicon glyphicon-thumbs-down"></span>',
        algorithm: "plus",
        parts: null
    }
    top_step_on(obj);
}

function reviewup(obj) {
    var obj = {
        dom: $(obj),
        url: "/Submit/ajaxrequest.ashx?cmd=LikeReview&reviewid=" + $(obj).data("id"),
        algorithm: "plus",
        parts: $(".likeit_" + $(obj).data("id")),
        total: $(".totalit_" + $(obj).data("id"))
    }
    top_step_on(obj);
}

function reviewdown(obj) {
    var obj = {
        dom: $(obj),
        url: "/Submit/ajaxrequest.ashx?cmd=UnLikeReview&reviewid=" + $(obj).data("id"),
        display: '<span class="glyphicon glyphicon-thumbs-down"></span>',
        algorithm: "plus",
        parts: $(".unlikeit_" + $(obj).data("id")),
        total: $(".totalit_" + $(obj).data("id"))
    }
    top_step_on(obj);
}

function top_step_on(obj) {
    var $obj = $(obj.dom);
    if (!$obj.hasClass("selected")) {
        $obj.addClass("selected");
        $.ajax({
            type: "POST",
            url: obj.url,
            success: function (data, textStatus) {
                if (data) {
                    $.tipsBox({
                        obj: $obj,
                        str: obj.display,
                        callback: function () {
                            $obj.addClass("on");
                            var number = parseInt($obj.data("number"));
                            if (obj.algorithm != "reduce") {
                                number += 1;
                            } else {
                                number -= 1;
                            }
                            if (number < 0) {
                                number = 0;
                            }
                            if (obj.parts) {
                                $(obj.parts).text(number);
                            } else {
                                $obj.text(number);
                            }
                            if (obj.total && $obj.data("total")) {
                                var total = parseInt($obj.data("total")) + 1;
                                $($obj.total).html(total);
                                $("[data-id=" + $obj.data("id") + "][data-total=" + $obj.data("total") + "]").data("total", total);
                            }
                        }
                    });
                } else {
                    $obj.removeClass("selected");
                }
            },
            complete: function (XMLHttpRequest, textStatus) {
            },
            error: function () {
            }
        });
    }
}

function blogreview(obj) {
    var $obj = $(obj);
    var $btn = $obj.find("[type=submit]").button('loading');
    var $content = $("[name=content]", $obj);
    var $reviewer = $("[name=reviewer]", $obj);
    if ($content.val() == "" || $reviewer.val() == "") {
        $btn.button('reset');
        alert(convertLanguage("general_the_content_cannot_be_blank", "the content cannot be blank"));
        return false;
    }
    $.ajax({
        type: "POST",
        url: "/Submit/ajaxrequest.ashx?cmd=BlogReview&blogid=" + $obj.data("id"),
        data: {
            content: escape($content.val()),
            reviewer: escape($reviewer.val())
        },
        success: function (data) {
            data = eval('(' + data + ')');
            $btn.button('reset');
            if (data.success) {
                $("[type=reset]", $obj).click();
                if (data.showis) {
                    $(".blogreviews").data("pageindex", "1");
                    getblogreview();
                    $('body,html').animate({
                        scrollTop: $("#blogreviews_model").show().offset().top
                    }, 500);
                } else {
                    alert(convertLanguage("general_submit_successfully", "Submit successfully, pending audit..."));
                }
            } else {
                alert(convertLanguage("general_submission_failed", "Submission Failed"));
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
    return false;
}

function getblogreview() {
    var $obj = $(".blogreviews"),
        id = $obj.data("id"),
        pageindex = parseInt($obj.data("pageindex")),
        pagesize = parseInt($obj.data("pagesize")),
        html = "",
        $model = $obj.data("model");
    $obj.addClass("lodding").show();
    $.ajax({
        type: "POST",
        url: "/Submit/ajaxrequest.ashx?cmd=GetBlogReview&blogid=" + id + "&pageindex=" + pageindex + "&pagesize=" + pagesize,
        success: function (data) {
            data = eval('(' + data + ')');
            if (data.total > 0) {
                $.each(data.list, function (index, obj) {
                    if ($model) {
                        $model(index, obj);
                    } else {

                        if (obj.reviewtime.indexOf(".") != -1) {
                            var number = obj.reviewtime.indexOf(".");
                            obj.reviewtime = obj.reviewtime.substring(0, number);
                        }
                        obj.reviewtime = obj.reviewtime.split("T").join(" ");

                        html += '<div class="panel panel-default" data-id="' + obj.id + '">';
                        html += '<div class="panel-heading">By ' + obj.reviewer + ' on ' + obj.reviewtime;
                        html += '<div class="right">';
                        html += '<span class="glyphicon glyphicon-thumbs-up" onclick="blogreviewup(this);" data-id="' + obj.id + '" data-number="' + obj.up + '">' + obj.up + '</span>';
                        html += '<span class="glyphicon glyphicon-thumbs-down" onclick="blogreviewdown(this);" data-id="' + obj.id + '" data-number="' + obj.down + '">' + obj.down + '</span>';
                        html += '</div>';
                        html += '</div>';
                        html += '<div class="panel-body">';
                        html += '<div class="user_img" title="' + obj.reviewer + '">';
                        html += '<img class="img-circle" src="/asssets.51microshop.com/assets/images/user.jpg" alt="' + obj.reviewer + '">';
                        html += '<div>' + obj.reviewer + '</div>';
                        html += '</div>';
                        html += obj.content;
                        html += '</div>';
                        html += '</div>';
                    }
                })
                if (html == "") {
                    html = '<div class="no_list"><p>' + convertLanguage("general_js_there_is_no_comment", "There is no comment") + '</p></div>';
                }
                $obj.html(html + blogpaging(data.total, pageindex, pagesize, 5)).removeClass("lodding");
            } else {
                $obj.hide();
            }
            $(".reviewnumber").text(data.total);
            $obj.find(".blogpaging li").click(function () {
                if ($(this).hasClass("previous")) {
                    pageindex -= 1;
                } else if ($(this).hasClass("next")) {
                    pageindex += 1;
                } else {
                    pageindex = $(this).data("num");
                }
                $obj.data("pageindex", pageindex);
                getblogreview();
            });
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
}

function blogpaging(total, pageindex, pagesize, showpaging) {
    var html = "",
        previous_show = 0,
        next_show = 0;
    if (total > pagesize) {
        var list = parseInt(total / pagesize);
        if (total % pagesize > 0) {
            list += 1;
        }
        html += '<div class="list_fy blogpaging"><span class="total">' + convertLanguage("cart_total", "Total") + '<em>' + list + '</em>pages</span><ul class="pagination">';
        if (pageindex != 1) {
            html += '<li class="previous" title="Previous"><span>&laquo;</span></li>';
        }
        for (var i = 1; i <= list; i++) {
            if (showpaging >= list) {
                if (i == pageindex) {
                    html += '<li class="active" data-num="' + i + '"><span>' + i + '</span></li>';
                } else {
                    html += '<li data-num="' + i + '"><span>' + i + '</span></li>';
                }
            } else {
                if (pageindex > 3) {
                    previous_show = pageindex - 2;
                    next_show = pageindex + 2;
                    if (next_show > list) {
                        previous_show = list - 4;
                        next_show = list;
                    }
                } else {
                    previous_show = 1;
                    next_show = showpaging;
                }
                if (i >= previous_show && i <= next_show) {
                    if (i == pageindex) {
                        html += '<li class="active" data-num="' + i + '"><span>' + i + '</span></li>';
                    } else {
                        html += '<li data-num="' + i + '"><span>' + i + '</span></li>';
                    }
                }
            }
        }
        if (pageindex < list) {
            html += '<li class="next" title="Next"><span>&raquo;</span></li>';
        }
        html += '</ul></div>';
    }
    return html;
}

/*
******************
   getbloglist
******************
*/
(function ($) {
    $.fn.getbloglist = function (options) {
        var $this = $(this),
            $masonry = null,
            add_ajax_count = 0,
            def = {
                dom: "> ul",
                dom_li: ".blog_list_li",
                more: ".get_more",
                obtain: true,
                masonry: true,
                cmd: "GetBlog",
                url: {
                    "pageindex": 1,
                    "pagesize": 20
                },
                paging: null,
                total: null,
                oss: "?x-oss-process=image/resize,w_767,q_80",
                scrolldom: window,
                scrolltop: -200,
                animation: 500,
                add_pageindex: true,
                paging_dom: ".paging_span",
                total_dom: ".total_span",
                number_dom: ".list_number_span",
                pageindex_dom: ".pageindex_span",
                get_data: true,
                model_html: function (demol) {
                    var html = "";
                    html += '<li class="' + $this.dom_li.replace(/[\#|\.]/g, "") + '" data-index="' + demol.id + '">';
                    html += '<div class="blog_list_li_model">';
                    if (demol.coverimage) {
                        try {
                            demol.coverimage = JSON.parse(demol.coverimage.replaceAll("&quot;", "\""));
                            if (demol.coverimage && demol.coverimage.src != "") {
                                html += '<div class="blog_li_img"><a href="' + demol.url + '" title="' + convert(demol.title) + '"><img src="' + demol.coverimage.src + $this.oss + '"></a></div>';
                            }
                        } catch {
                            html += '<div class="blog_li_img"><a href="' + demol.url + '" title="' + convert(demol.title) + '"><img src="' + demol.coverimage + $this.oss + '"></a></div>';
                        }
                    }
                    html += '<div class="blog_li_content">';
                    html += '<h2 class="blog_list_title"><a href="' + demol.url + '" title="' + convert(demol.title) + '">' + demol.title + '</a></h2>';
                    html += '<ul class="list-inline blog_meta">';
                    html += '<li><span class="glyphicon glyphicon-folder-close"></span><a href="' + demol.typeurl + '" title="' + convert(demol.typename) + '">' + demol.typename + '</a></li>';
                    html += '<li><span class="glyphicon glyphicon-calendar"></span><a href="' + demol.url + '" title="' + convert(demol.title) + '">' + demol.showdatestr + '</a></li>';
                    html += '</ul>';
                    html += '<p class="blog_content">' + demol.summary + '</p>';
                    html += '</div>';
                    html += '</div>';
                    html += '</li>';
                    return html;
                }
            },
            prop = {
                init: function () {
                    var lodding_img = true,
                        $dom_li_img = $this.find($this.dom_li + " img");
                    if ($this.masonry) {
                        if ($dom_li_img.length > 0) {
                            lodding_img = 0;
                            $this.find($this.dom_li + " img").each(function (index, element) {
                                var img = new Image();
                                img.src = $(this).attr("src");
                                if (img.complete) {
                                    lodding_img++;
                                    if (lodding_img == $dom_li_img.length) {
                                        $this.find($this.dom).masonry({
                                            itemSelector: $this.dom_li,
                                            columnWidth: $this.dom_li,
                                            percentPosition: true
                                        });
                                        init_bloglist();
                                    }
                                    return;
                                }
                                img.onload = function () {
                                    lodding_img++;
                                    if (lodding_img == $dom_li_img.length) {
                                        $this.find($this.dom).masonry({
                                            itemSelector: $this.dom_li,
                                            columnWidth: $this.dom_li,
                                            percentPosition: true
                                        });
                                        init_bloglist();
                                    }
                                };
                            });
                        } else {
                            $this.find($this.dom).masonry({
                                itemSelector: $this.dom_li,
                                columnWidth: $this.dom_li,
                                percentPosition: true
                            });
                        }
                    }
                    if ($this.paging != null && $this.paging == 1) {
                        return false;
                    }
                    ;
                    if ($this.total != null && $this.total <= $this.url.pagesize) {
                        return false;
                    }
                    ;
                    if (lodding_img) {
                        init_bloglist();
                    }

                },
                add: function () {
                    return ajax_bloglist();
                }
            }
        var init_bloglist = function () {
            if ($this.obtain) {
                $($this.scrolldom).on('scroll', function () {
                    var scrollTop = $(document).scrollTop(),
                        body_h = $($this.scrolldom).height(),
                        document_h = $(document).height(),
                        dom_top = $this.find($this.dom).offset().top,
                        dom_h = $this.find($this.dom).height();
                    if (dom_h + dom_top + $this.scrolltop <= scrollTop + body_h + $this.scrolltop && add_ajax_count == 0) {
                        add_ajax_count++;
                        ajax_bloglist();
                    }
                    ;
                })
            } else {
                $this.find($this.more).click(function () {
                    ajax_bloglist();
                });
            }
        }
        var release = function () {
            $this.removeClass("model_lodding");
            add_ajax_count = 0;
            $this.find($this.number_dom).text($($this.dom_li, $this).length);
        }
        var convert = function (obj) {
            return obj.replace(/\"/g, "&quot;");
        }
        var loadImage = function (url, callback) {
            var img = new Image();
            img.src = url;
            if (img.complete) {
                callback;
                return;
            }
            img.onload = function () {
                callback;
            };
        };
        var load_masonry = function (html) {
            $this.find($this.dom).masonry('appended', html);
        }
        var model_html = function (data) {
            $.each(data.list, function (index, domel) {
                var html = "";
                html = $this.model_html(domel);
                //html = $this.model_html.apply(this,domel);
                html = $(html);
                if ($this.masonry) {
                    setTimeout(function () {
                        if (domel.coverimage) {
                            $this.find($this.dom).append(html);
                            loadImage(html.find("img").attr("src"), load_masonry(html));
                        } else {
                            $this.find($this.dom).append(html);
                            $this.find($this.dom).masonry('appended', html);
                        }
                        if (data.list.length == index + 1) {
                            release();
                        }
                    }, $this.animation);

                } else {
                    $this.find($this.dom).append(html);
                    if (data.list.length == index + 1) {
                        release();
                    }
                    ;
                }
                ;
            });
        }
        var ajax_bloglist = function () {
            var url = $this.cmd;
            if (!$this.get_data || $this.paging == $this.url.pageindex) {
                return false;
            } else {
                $this.url.pageindex++;
            }
            ;
            $this.addClass("model_lodding");
            $.each($this.url, function (name, value) {
                url += "&" + name + "=" + value;
            });
            $.ajax({
                type: "POST",
                url: "/Submit/ajaxrequest.ashx?cmd=" + url,
                dataType: "JSON",
                success: function (data) {
                    var paging = parseInt(data.total / $this.url.pagesize);
                    if (data.total % $this.url.pagesize > 0) {
                        paging += 1;
                    }
                    ;
                    if (data.list.length > 0) {
                        $this.total = data.total;
                        $this.paging = paging;
                        model_html(data);
                        if (paging < $this.url.pageindex + 1) {
                            $this.find($this.more).hide();
                        }
                        ;
                    } else {
                        $this.url.pageindex = $this.paging.paging;
                        $this.get_data = false;
                        $this.find($this.more).hide();
                        release();
                    }
                    ;
                    $this.find($this.total_dom).text($this.total);
                    $this.find($this.paging_dom).text($this.paging);
                    $this.find($this.pageindex_dom).text($this.url.pageindex);
                },
                complete: function (XMLHttpRequest, textStatus) {
                },
                error: function () {
                    release();
                }
            })
        }
        $this = $.extend($this, def, options, prop);
        $this.init();
        return $this;
    }
})(jQuery);
/*
******************
     plupload
******************
*/

(function ($) {
    $.fn.uploader_model = function (options) {
        var def = {
            host: 'https://usaimages.oss-accelerate.aliyuncs.com/',
            url: "/Submit/AliOSS.ashx",
            browse_button: 'selectfiles',
            flash_swf_url: 'lib/plupload-2.1.2/js/Moxie.swf',
            silverlight_xap_url: 'lib/plupload-2.1.2/js/Moxie.xap',
            dir: "/CommentPic/",
            container: "#container",
            filters: {
                mime_types: [{
                    title: "Image files",
                    extensions: "jpg,jpeg,gif,png,bmp,heif,heic"
                }],
                max_file_size: '4mb',
                prevent_duplicates: false
            },
            ossfile: "#ossfile",
            postfiles: "#postfiles",
            ready: "ready",
            lodding: "file_lodding",
            automatic: false,
            multi_selection: true,
            g_object_name_type: "random_name",
            max_file: 9
        }
        var $this = $.extend($(this), def, options);
        return $this.each(function () {
            var new_multipart_params = {
                'key': "",
                'policy': "",
                'OSSAccessKeyId': "",
                'success_action_status': '200',
                'signature': ""
            },
                key = '',
                expire = 0,
                g_object_name = '',
                now = timestamp = Date.parse(new Date()) / 1000,
                current_index = 0;
            var ifjq = function (obj) {
                var $obj = $(obj);
                if ($obj instanceof jQuery) {
                    $obj = $obj.get(0);
                }
                return $obj;
            },
                get_signature = function () {
                    now = timestamp = Date.parse(new Date()) / 1000;
                    if (expire < now + 3) {
                        $.ajax({
                            async: false,
                            dataType: "json",
                            url: $this.url,
                            data: {
                                action: "signature",
                                rnd: Math.random()
                            },
                            success: function (data) {
                                new_multipart_params.policy = data["policy"];
                                new_multipart_params.OSSAccessKeyId = data["accessid"];
                                new_multipart_params.signature = data["signature"];
                                key = data["userid"] + $this.dir;
                                return true;
                            },
                            error: function (data) {
                                alert(convertLanguage("general_your_browser_does_not_support_xmlhttp", "Your browser does not support XMLHTTP."));
                            }
                        });
                    }
                    return false;
                },
                random_string = function (len) {
                    len = len || 32;
                    var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
                    var maxPos = chars.length;
                    var pwd = '';
                    for (i = 0; i < len; i++) {
                        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
                    }
                    return pwd;
                },
                get_suffix = function (filename) {
                    if (filename == undefined)
                        return '';
                    pos = filename.lastIndexOf('.')
                    suffix = ''
                    if (pos != -1) {
                        suffix = filename.substring(pos)
                    }
                    return suffix;
                },
                calculate_object_name = function (filename) {
                    if ($this.g_object_name_type == 'local_name') {
                        g_object_name += "${filename}"
                    } else if ($this.g_object_name_type == 'random_name') {
                        suffix = get_suffix(filename);
                        g_object_name = key + random_string(10) + suffix;
                    }
                },
                get_uploaded_object_name = function (filename) {
                    if ($this.g_object_name_type == 'local_name') {
                        tmp_name = g_object_name
                        tmp_name = tmp_name.replace("${filename}", filename);
                        return tmp_name
                    } else if ($this.g_object_name_type == 'random_name') {
                        return g_object_name
                    }
                },
                set_upload_param = function (up, file, ret) {
                    if (new_multipart_params.policy == "" || new_multipart_params.OSSAccessKeyId == "" || new_multipart_params.signature == "") {
                        ret = false;
                    }
                    if (ret == false) {
                        ret = get_signature();
                    }
                    g_object_name = key;
                    if (file.name != '') {
                        calculate_object_name(file.name);
                    }
                    new_multipart_params.key = g_object_name;
                    file.url = g_object_name;
                    up.setOption({
                        'url': $this.host,
                        'multipart_params': new_multipart_params
                    });
                    up.start();
                },
                previewImage = function (file, callback) {
                    if (!file || !/image\//.test(file.type)) return;
                    if (file.type == 'image/gif') {
                        var preloader = new mOxie.FileReader();
                        preloader.onload = function () {
                            callback(preloader.result);
                            //preloader.destroy();
                            preloader = null;
                        }
                        preloader.readAsDataURL(file.getSource());
                    } else {
                        var preloader = new mOxie.Image();
                        preloader.onload = function () {
                            var imgsrc = preloader.type == 'image/jpeg' ? preloader.getAsDataURL('image/jpeg', 80) : preloader.getAsDataURL();
                            callback && callback(imgsrc);
                            preloader.destroy();
                            preloader = null;
                        };
                        preloader.load(file.getSource());
                    }
                };
            var uploader = new plupload.Uploader({
                runtimes: 'html5,flash,silverlight,html4',
                browse_button: $this.browse_button,
                multi_selection: $this.multi_selection,
                container: ifjq($this.container),
                flash_swf_url: $this.flash_swf_url,
                silverlight_xap_url: $this.silverlight_xap_url,
                url: 'https://oss.aliyuncs.com',
                filters: $this.filters,
                init: {
                    PostInit: function () {
                        if ($this.automatic) {
                            set_upload_param(uploader, '', false);
                            return false;
                        } else {
                            $($this.postfiles).click(function () {
                                set_upload_param(uploader, '', false);
                                return false;
                            })
                        }
                    },

                    FilesAdded: function (up, files) {
                        if (up.ExecuteFilesAdd == undefined || up.ExecuteFilesAdd == false) {
                            var files_list = up.files;
                            $.each(files_list, function (index, obj) {
                                if ($this.max_file <= index) {
                                    up.files.splice($this.max_file, 1);
                                }
                            })
                            plupload.each(files, function (file) {
                                if ($this.max_file > current_index) {
                                    var html = "";
                                    html += '<div id="' + file.id + '" class="file_li ' + $this.ready + '">';
                                    html += '<div class="file_progress">';
                                    html += '<div class="progress">';
                                    html += '<div class="progress-bar"></div>';
                                    html += '</div>';
                                    html += '<p>' + file.name + '</p>';
                                    html += '<p>' + plupload.formatSize(file.size) + '</p>';
                                    html += '</div>';
                                    html += '<a class="file_remove"><i class="glyphicon glyphicon-trash"></i></a>';
                                    html += '<a class="file_swipebox"><img class="file_img" src="/assets/images/loading.gif"></a>';
                                    html += '</div>';
                                    html = $(html);
                                    previewImage(file, function (src) {
                                        html.find(".file_img").attr("src", src);
                                    })
                                    html.find(".file_remove").click(function () {
                                        var $obj = $(this).closest(".file_li");
                                        $.each($this.files, function (index, obj) {
                                            if (obj.id == $obj.attr("id")) {
                                                $this.files.splice(index, 1);
                                                $this.removeClass("files_full");
                                                current_index--;
                                                return false;
                                            }
                                        })
                                        $obj.remove();
                                    })
                                    $(html).appendTo($this.ossfile);
                                    current_index++;
                                    if ($this.max_file == current_index) {
                                        $this.addClass("files_full");
                                    } else {
                                        $this.removeClass("files_full");
                                    }
                                } else {
                                    $this.addClass("files_full");
                                    alert(convertLanguage("general_upload_up_to", "Upload up to") + " " + $this.max_file);
                                    return false;
                                }
                            });
                            if ($this.automatic) {
                                up.start();
                            }
                        }
                    },

                    BeforeUpload: function (up, file) {
                        set_upload_param(up, file, true);
                    },

                    UploadProgress: function (up, file) {
                        var $obj = $("#" + file.id).addClass($this.ready).find(".progress-bar");
                        $obj.html("<span>" + file.percent + "%</span>");
                        $obj.width(file.percent + "%");
                    },

                    FileUploaded: function (up, file, info) {
                        if (up.ExecuteFileUploaded == undefined || up.ExecuteFileUploaded == false) {
                            var $obj = $("#" + file.id);
                            current_index--;
                            $obj.find(".file_img").attr("src", up.host + file.url);
                            $obj.removeClass($this.ready).removeClass($this.lodding);
                        }
                    },

                    Error: function (up, err) {
                        if (err.code == -600) {
                            alert(convertLanguage("general_the_file_size_is_out_of_bounds", "The file size is out of bounds:"));
                        } else if (err.code == -601) {
                            alert(convertLanguage("general_only_upload_pictures", "Only upload pictures!"));
                        } else if (err.code == -602) {
                            alert(convertLanguage("general_file_uploaded", "File uploaded"));
                        } else {
                            alert(convertLanguage("general_error_xml", "Error xml:") + " " + err.response);
                        }
                    }
                }
            });
            $this = $.extend($this, uploader);
            $this.init();
            return $this;
        });
    }
})(jQuery);
function ajax_productevaluate(obj, add_success) {
    var url = "?cmd=ProductReview";
    $(obj).find("[name=txt_reviewpic]").val($(obj).find("[name=txt_reviewpic]").val().replaceAll('https://usaimages.oss-accelerate.aliyuncs.com/', 'https://images.51microshop.com/'));
    var context = {
        fullname: $(obj).find("[name=txt_name]").val(),
        text: $(obj).find("[name=txt_review]").val(),
        reviewpic: $(obj).find("[name=txt_reviewpic]").val(),
        score: $(obj).find("[name=rating]").val(),
        productid: $(obj).data("id")
    }
    if ($('[name="txt_title"]').length > 0) {
        context.title = $('[name="txt_title"]').val();
    }
    $.each(context, function (name, value) {
        url += "&" + name + "=" + value;
    });
    $.ajax({
        type: "POST",
        url: "/Submit/ajaxrequest.ashx" + url,
        success: function (data) {
            data = eval('(' + data + ')');
            if (data.success) {
                if (data.show) {
                    add_success($(obj), data.id);
                } else {
                    alert(convertLanguage("general_review_success", 'Review success,Customer service will respond to your comments as soon as possible.'));
                }
            } else {
                alert(convertLanguage("general_submission_failure", 'Submission failure!'));
            }
            $(".reviewpic_list .file_li").remove();
            $(obj).removeClass("model_lodding").find("[type=reset]").click();
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
            $(obj).removeClass("model_lodding");
        }
    });
}

function current_date(data) {
    var curTime = data || new Date();
    var weekday = new Array(7);
    weekday[0] = "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";
    var month = new Array(12);
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    var strCurTime = weekday[curTime.getDay()] + ", " + curTime.getDate() + " " + month[curTime.getMonth()] + " " + curTime.getFullYear();
    return strCurTime;
}

function add_comment_model(obj, Callback) {
    var $obj = $(obj);
    $.ajax({
        type: "POST",
        url: "/Submit/ajaxrequest.ashx?cmd=ProductReviewComment&reviewid=" + $obj.data("id") + "&fullname=" + $obj.find("[name=model_name]").val() + "&comment=" + $obj.find("[name=model_text]").val(),
        success: function (data) {
            data = eval('(' + data + ')');
            if (data.success) {
                var commentnum = parseInt($obj.data("commentnum")) + 1;
                $(".comment_span_" + $obj.data("id")).text(commentnum);
                $("[data-id=" + $obj.data("id") + "][data-commentnum= " + $obj.data("commentnum") + "]").data("commentnum", commentnum);
                if (data.show) {
                    Callback($obj);
                    $obj.find("[type=reset],[data-dismiss=modal]").click();
                } else {
                    $obj.find("[type=reset],[data-dismiss=modal]").click();
                    alert(convertLanguage("general_the_submission_is_pending_for_review", "The submission is pending for review!"));
                }
            } else {
                alert(convertLanguage("general_submission_failure", 'Submission failure!'));
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
    return false;
}

function subscribe(obj) {
    var $obj = $(obj),
        sub = {},
        url = "";
    var ok = $obj.data("ok") || convertLanguage("sub_subscribe_to_success", "Subscribe to success!");
    var not = $obj.data("not") || convertLanguage("sub_has_been_subscribed", "Has been subscribed!");
    var no = $obj.data("no") || convertLanguage("sub_subscription_failed", "Subscription failed!");
    sub.email = $obj.find("[name=sub_email]").val();
    sub.name = $obj.find("[name=sub_name]").val();
    $.each(sub, function (names, value) {
        if (value) {
            url += "&" + names + "=" + value;
        }
        ;
    })
    if (url == "") {
        return false;
    }
    ;
    $.ajax({
        type: "POST",
        url: "/Submit/ajaxrequest.ashx?cmd=MailSubscription" + url,
        success: function (data) {
            data = eval('(' + data + ')');
            if (data.success) {
                $obj.find("[type=reset]").click();
                alert(ok);
            } else {
                if (data.exict) {
                    alert(not);
                } else {
                    alert(no);
                }
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
            alert(no);
        }
    });
    return false;
}

function searchForm(obj) {
    var text = $(obj).find("input[type=search],input[type=text]").val(),
        tip = $(obj).data("tip") || convertLanguage("search_cannot_be_empty", "Sorry, you do not enter search keywords!");
    text = text.replace(/^\s+|\s+$/g, '');//.replace(/\s+/g, '%2D');
    text = text.replace(/&/g, '');
    text = text.replace(/\//g, '卍');
    if (text == '.')
        text = "";
    if (text) {
        window.location.href = basepath + "/s-" + encodeURIComponent(text) + "?sort=6d";
    } else {
        alert(tip);
    }
    return false;
}

function emailUrl(obj) {
    var email = {
        'qq.com': 'https://mail.qq.com',
        'gmail.com': 'https://mail.google.com',
        'sina.com': 'https://mail.sina.com.cn',
        '163.com': 'https://mail.163.com',
        '126.com': 'https://mail.126.com',
        'yeah.net': 'https://www.yeah.net/',
        'sohu.com': 'https://mail.sohu.com/',
        'tom.com': 'https://mail.tom.com/',
        'sogou.com': 'https://mail.sogou.com/',
        '139.com': 'https://mail.10086.cn/',
        'hotmail.com': 'https://www.hotmail.com',
        'live.com': 'https://login.live.com/',
        'live.cn': 'https://login.live.cn/',
        'live.com.cn': 'https://login.live.com.cn',
        '189.com': 'https://webmail16.189.cn/webmail/',
        'yahoo.com.cn': 'https://mail.cn.yahoo.com/',
        'yahoo.com': 'https://login.yahoo.com/',
        'yahoo.cn': 'https://mail.cn.yahoo.com/',
        'eyou.com': 'https://www.eyou.com/',
        '21cn.com': 'https://mail.21cn.com/',
        '188.com': 'https://www.188.com/',
        'foxmail.coom': 'https://www.foxmail.com',
        'outlook.com': 'https://outlook.live.com',
    };
    return email[obj.split('@')[1]] || null;
}

function retrievePassword(obj) {
    var html = $(obj).data('success') || '<div class="text-center"><i class="glyphicon glyphicon-envelope" style="font-size:50px;"></i><h3>' + convertLanguage("general_email_has_been_sent", "email has been sent") + '</h3><p>' + convertLanguage("general_email_has_been_sent_content", "When you receive your sign in information, follow the directions in the email to reset your password") + '<p></div>',
        title_2 = $(obj).data('spec') || convertLanguage("register_validation_invalid_email", 'Please enter a valid email address'),
        title_3 = $(obj).data('not') || convertLanguage("register_validation_invalid_email", 'Please enter a valid email address'),
        title_4 = $(obj).data('fail') || convertLanguage("register_email_failed_to_send", 'Email failed to send'),
        email = $(obj).find('[name=txt_email]').val();
    $.ajax({
        type: "POST",
        url: "/Submit/ajaxrequest.ashx?cmd=ResetPassword&txt_email=" + email,
        success: function (data) {
            data = eval('(' + data + ')');
            if (data.success) {
                var url = emailUrl(email);
                if (url) {
                    html = $(html).append('<a class="btn btn-info btn-lg" href="' + url + '" target="_blank">' + convertLanguage("general_go_view", "Go View") + '</a>');
                }
                $(obj).html(html);
            } else if (data.state == 2) {
                alert(title_2);
            } else if (data.state == 3) {
                alert(title_3);
            } else {
                alert(title_4);
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    })
    return false;
}

function resetPassword(obj) {
    if ($(obj).find("[name=txt_password]").val() != $(obj).find("[name=txt_npassword]").val()) {
        alert(convertLanguage("register_validation_password_confirm", "Your New and Verified passwords do not match, try again."));
        return false;
    }
}

function texttohtml(text) {
    try {
        if (text == '' || text == undefined) {
            return null;
        }
        if (text.indexOf('&amp;') != -1 || text.indexOf('&quot;') != -1 || text.indexOf('&lt;') != -1 || text.indexOf('&gt;') != -1 || text.indexOf('&#39;') != -1) {
            return text;
        }
        return $('<div/>').text(text).html();
    } catch (err) {
        return text;
    }
}

function setCartValueExp() {
    var exp = new Date();
    exp.setDate((exp.getDate() + 60));
    $.cookie('cartvalue', $.cookie('cartvalue'), {
        path: '/',
        expires: exp
    })
}

function getUrlpara(paraName) {
    var sUrl = location.href;
    var sReg = "(?:\\?|&){1}" + paraName + "=([^&]*)"
    var re = new RegExp(sReg, "gi");
    if (!re.exec(sUrl)) {
        return "";
    } else {
        return RegExp.$1.split('#')[0];
    }
}

function httpsImageOperate(src) {
    if (location.href.toLowerCase().indexOf("https://") == 0) {
        src = src.replace("http://", "https://");
    }
    return src;
}

(function ($) {
    $.fn.navFixedTop = function (options) {
        return this.each(function (index, element) {
            if ($(this).data("fixedCopy")) {
                return;
            }
            var init = $.extend({
                newShow: eval($(this).attr("data-fixed-newShow") || true),
                marginTop: parseInt($(this).attr("data-fixed-marginTop")) || 0,
                range: $(this).attr("data-fixed-range") || false,
                combi: eval($(this).attr("data-fixed-combi") || true),
                shape: eval($(this).attr("data-fixed-shape") || false),
                outerHeight: eval($(this).attr("data-fixed-outerHeight") || false),
                outerWidth: eval($(this).attr("data-fixed-outerWidth") || false),
                distance: parseInt($(this).attr("data-fixed-distance")) || 0,
            }, options),
                $div = $('<div/>').css({
                    "font-size": 0,
                    "padding": 0,
                    "margin": 0
                }),
                $obj = $(this),
                generate = false,
                top = 0,
                status = true,
                rangeTop = false,
                left = false,
                width = false,
                style = {},
                newGet = function () {
                    status = true;
                    top = $obj.attr("style", ($obj.attr("style") || "").replace(/top[^;]+;/ig, "")).removeClass("navFixedTop").offset().top + init.distance;
                    if (init.range) {
                        rangeTop = $(init.range).offset().top + $(init.range).outerHeight() - $obj.outerHeight(init.outerHeight);
                    }
                    if (init.shape) {
                        left = $obj.attr("style", ($obj.attr("style") || "").replace(/left[^;]+;/ig, "")).removeClass("navFixedTop").offset().left;
                        width = $obj.attr("style", ($obj.attr("style") || "").replace(/width[^;]+;/ig, "")).removeClass("navFixedTop").outerWidth(init.outerWidth);
                    }
                    generate = true;
                },
                scrollNav = function () {
                    if (!generate) {
                        newGet();
                    }
                    var modelTop = 0 + init.marginTop,
                        addNums = addNum();
                    if (init.combi) {
                        modelTop += addNums;
                    }
                    if ($(window).scrollTop() + modelTop >= top) {
                        style["top"] = modelTop;
                        if (rangeTop && rangeTop - modelTop < $(window).scrollTop()) {
                            style["top"] = rangeTop - $(window).scrollTop();
                            $obj.addClass("navFixedBot");
                        } else {
                            $obj.removeClass("navFixedBot");
                        }
                        if (status != "open" || $obj.hasClass("navFixedBot")) {
                            $obj.trigger("fixed.open.before");
                            if (typeof (left) == "number") {
                                style["left"] = left;
                            }
                            if (typeof (width) == "number") {
                                style["width"] = width;
                            }
                            if ($obj.is(":hidden")) {
                                $div.css({
                                    "padding-top": 0
                                });
                            } else {
                                $div.css({
                                    "padding-top": $obj.outerHeight(init.outerHeight)
                                });
                            }
                            $obj.addClass("navFixedTop").css(style);
                            $obj.trigger("fixed.open.final");
                            status = "open";
                        }
                    } else {
                        if (status != "close") {
                            $obj.trigger("fixed.close.before");
                            $obj.attr("style", ($obj.attr("style") || "").replace(/top[^;]+;/ig, ""));
                            if (typeof (left) == "number") {
                                $obj.attr("style", ($obj.attr("style") || "").replace(/left[^;]+;/ig, ""));
                            }
                            if (typeof (width) == "number") {
                                $obj.attr("style", ($obj.attr("style") || "").replace(/width[^;]+;/ig, ""));
                            }
                            $obj.removeClass("navFixedTop navFixedBot");
                            $div.css({
                                "padding-top": 0
                            });
                            $obj.trigger("fixed.close.final");
                            status = "close";
                        }
                    }
                },
                addNum = function () {
                    var n = 0;
                    $(".navFixedPuzzle").each(function (index, element) {
                        if ($(this).is($obj)) {
                            return false;
                        }
                        if (!$(this).is(":hidden")) {
                            n += $(this).outerHeight(init.outerHeight);
                        }
                    });
                    return n;
                };
            if (init.combi) {
                $obj.addClass("navFixedPuzzle");
            } else {
                $obj.removeClass("navFixedPuzzle");
            }
            if (init.newShow) {
                $div.show();
            } else {
                $div.hide();
            }
            $obj.after($div).data("fixedCopy", $div);
            $(window).on("load resize", function () {
                generate = false;
                newGet();
            }).on("load scroll resize", function () {
                scrollNav();
                $obj.trigger("fixed.scroll.top", [$(window).scrollTop()]);
            });

        });
    }
    $("[data-fixed-model]").navFixedTop();
})(jQuery);
$(function () {
    if (!(/\/password$/.test(location.pathname))) {
        googleanalyticsoperate();
        facebookpixeloperate();
        pinterestpixeloperate();
    }
})

// by cc  pinterest像素代码
function pinterestpixeloperate() {
    if (Shopify.pinteresttagid != undefined && Shopify.pinteresttagid != "") {
        // 追踪网页访问
        pintrk('track', 'pagevisit');
        // 将产品加入购物车时
        if ($('body').attr("data-template") == "product") {
            // 加入购物车
            var productId = $("#prodcutid").val();
            $('[data-url="/cart"],.hide_button_add_wanquanyun').bind("click", function () {
                pintrk('track', 'AddToCart', {
                    value: $("#f_price").text().substring(1, $("#f_price").text().length),
                    order_quantity: parseInt($("#txt_num").attr("value")),
                    currency: 'USD',
                    product_id: productId
                });
            });
        }
        // 发起结账
        if ($('body').attr("data-template") == "checkout" || $('body').attr("data-template") == "checkoutnew") {
            // 商品数量
            var num_items = 0;
            // line_items 每一项商品对象
            var product_line_items = [];
            $.each($('[data-type="checkoutitem"]'), function () {
                num_items += parseInt($(this).attr("data-quantity"));
                var $that = $(this);
                var pro_item = {
                    product_name: $that.attr("data-productname"),
                    product_id: $that.attr("data-productid"),
                    product_price: parseFloat($that.attr("data-price")),
                    product_quantity: parseInt($that.attr("data-quantity"))
                };
                product_line_items.push(pro_item);
            });
            //console.log(product_line_items)
            $('[action="/checkout"]').find('[type="submit"]').bind("click", function () {
                pintrk('track', 'checkout', {
                    value: (parseFloat($('[data-type="total"]').text().replace(Shopify.currency[0].tags, '')) / Shopify.currency[0].rate).toFixed(2),
                    order_quantity: num_items,
                    currency: 'USD',
                    line_items: product_line_items
                });
            })
        }
        // 搜索
        if ($('body').attr("data-template") == "search") {
            // 每套主题搜索文本框加个类名，以获取搜索字段 search_cc_lys 需升级
            var search_val = $(".search_cc_lys").val();
            pintrk('track', 'search', {
                search_query: search_val
            });
        }
        //填写完注册表单时触发
        if ($('[action="/register"]').length > 0) {
            $('[action="/register"]').find('[type="submit"]').bind("click", function () {
                pintrk('track', 'signup');
            })
        }
        if ($('body').attr("data-template") == "register") {
            $('[type="submit"]').bind("click", function () {
                pintrk('track', 'signup');
            })
        }
        // 追踪视频

        // 追踪足迹
        pintrk('track', 'lead', {
            lead_type: 'Newsletter'
        });

    }
}

// by cc  pinterest像素代码

function facebookpixeloperate() {
    if (Shopify.facebookpixelid != undefined && Shopify.facebookpixelid != '') {
        //将产品加入购物车时
        if ($('body').attr("data-template") == "product") {
            //查看关键页面
            fbq('track', 'ViewContent', {
                content_type: "product",
                content_ids: ['' + Shopify.products[0].id + ''],
                content_name: Shopify.products[0].name,
                value: Shopify.products[0].price,
                currency: "USD"
            });
            //加入购物车
            //$('[onclick="addtocart(this)"]').bind("click", function () {
            $('[data-url="/cart"],.hide_button_add_wanquanyun').bind("click", function () {
                fbq('track', 'AddToCart', {

                    content_type: "product",
                    content_ids: ['' + Shopify.products[0].id + ''],
                    content_name: Shopify.products[0].name,
                    value: $("#f_price").text().substring(1, $("#f_price").text().length),
                    currency: "USD"
                });
            });
        }
        //在结账流程中添加支付信息时
        if ($('body').attr("data-template") == "success") {
            $('[onclick="SubmitData();"]').bind("click", function () {
                var orderitems = [];
                $.each($('[data-type="orderproduct"]'), function () {
                    orderitems.push('' + $(this).attr("data-val") + '')
                });
                fbq('track', 'AddPaymentInfo',
                    {
                        content_type: "product",
                        content_category: 'ordersuccess',
                        content_ids: orderitems,
                        currency: 'USD',
                        value: $('[data-type="order.totalprice"]').attr('data-val')
                    });
            })
        }


        //填写完注册表单时        
        if ($('body').attr("data-template") == "register") {
            $('[type="submit"]').bind("click", function () {
                fbq('track', 'CompleteRegistration', {
                    content_category: "register",
                    contents: $('[name="txt_email"]').val(),
                });
            })
        } else {
            if ($('[action="/register"]').length > 0) {
                $('[action="/register"]').find('[type="submit"]').on("click", function () {
                    fbq('track', 'CompleteRegistration', {
                        content_category: "register",
                        contents: $('[name="txt_email"]').val(),
                    });
                })
            }
        }

        //联系
        if ($('body').attr("data-template") == "page.contact") {
            $('[type="submit"]').bind("click", function () {
                fbq('track', 'Contact');
            })
        }
        //购物
        if ($('body').attr("data-template") == "payresult") {
            var content_ids = [];
            var num_items = 0;
            $.each($('[data-type="orderitem"]'), function () {
                content_ids.push('' + $(this).attr("data-productid") + '');
                num_items += parseInt($(this).attr("data-quantity"));
            });
            if (content_ids.length != 0) {
                fbq('track', 'Purchase',
                    {
                        content_type: "product",
                        content_ids: content_ids,
                        content_name: 'payresult',
                        currency: 'USD',
                        num_items: num_items,
                        value: $('[data-type="orderdetail"]').attr("data-totalprice")
                    });
            }
        }
        //搜索
        if ($('body').attr("data-template") == "search") {
            var content_ids = [];
            $('[data-type="product"]').each(function () {
                content_ids.push($(this).attr("data-id"))
            })
            fbq('track', 'Search', {
                content_type: "product",
                content_category: "search",
                content_ids: content_ids,
                search_string: location.href.split("/s-")[1]
            });
        }
        if ($('body').attr("data-template") == "tag") {
            var content_ids = [];
            $('[data-type="product"]').each(function () {
                content_ids.push($(this).attr("data-id"))
            })
            fbq('track', 'Search', {
                content_type: "product",
                content_category: "tag",
                content_ids: content_ids,
                search_string: location.href.split('/tags/')[1].split('.html')[0]
            });
        }
    }
}

function googleanalyticsoperate() {
    if (Shopify.googleanalyticsid != undefined && Shopify.googleanalyticsid != '') {
        var view_item_list = { "items": [] };
        $.each($('[data-type="product"]'), function () {
            view_item_list.items.push({
                "id": $(this).attr("data-id"),
                "name": $(this).attr("data-name"),
                "list_name": $('body').attr("data-template"),
                "brand": $(this).attr("data-brand"),
                "quantity": $(this).attr("data-quantity"),
                "price": $(this).attr("data-price")
            });
        });
        if (view_item_list.items != []) {
            gtag('event', 'view_item_list', view_item_list);
        }
        $('.cart_list .remove a').on("click", function () {
            var cartitemprice = $($(this).parent().prev().find('.money strong')[0]).text();
            cartitemprice = cartitemprice.substring(1, cartitemprice.length);
            gtag('event', 'remove_from_cart', {
                "items": [{
                    "id": $(this).parent().prev().find('.cart_td_qty').attr("data-id"),
                    "name": $(this).parent().prev().find('.title').text(),
                    "list_name": "shopcart",
                    "variant": $(this).parent().prev().find('.title span').text(),
                    "quantity": $(this).parent().prev().find('.cart_num').val(),
                    "price": $($(this).parent().prev().find('.money strong')[0]).text()
                }]
            });
        })

        if ($('body').attr("data-template") == "product") {
            gtag('event', 'view_item', {
                "items": [{
                    "id": Shopify.products[0].id,
                    "name": Shopify.products[0].name,
                    "list_name": "product detail",
                    "brand": Shopify.products[0].brand,
                    "quantity": Shopify.products[0].stock,
                    "price": Shopify.products[0].price
                }]
            });
        }
        $('body').on("click", '[onclick="addtocart(this)"]', function () {
            var variant = "";
            $.each($('#ul_skulist .select'), function () {
                variant += " " + $(this).attr("val");
            });
            gtag('event', 'add_to_cart', {
                "items": [{
                    "id": Shopify.products[0].id,
                    "name": Shopify.products[0].name,
                    "list_name": "product detail",
                    "brand": Shopify.products[0].brand,
                    "quantity": $("#txt_num").val(),
                    "price": $("#f_price").text().substring(1, $("#f_price").text().length),
                    "variant": variant
                }]
            });
        });


        if ($('body').attr("data-template") == "checkout" || $('body').attr("data-template") == "checkoutnew") {
            var checkoutitems = [];
            $.each($('[data-type="checkoutitem"]'), function () {
                checkoutitems.push({
                    "id": $(this).attr("data-productid"),
                    "name": $(this).attr("data-productname"),
                    "list_name": "checkout",
                    "variant": $(this).attr("data-variant"),
                    "quantity": $(this).attr("data-quantity"),
                    "price": $(this).attr("data-price")
                });
            });
            gtag('event', 'begin_checkout', { "items": checkoutitems, "coupon": "" });
            $('[action="/checkout"]').find('[type="submit"]').bind("click", function () {
                gtag('event', 'set_checkout_option', {
                    "checkout_step": 1,
                    "checkout_option": "place order"
                });
            })
        }

        if ($('body').attr("data-template") == "success") {
            $('[onclick="SubmitData();"]').bind("click", function () {
                gtag('event', 'set_checkout_option', {
                    "checkout_step": 2,
                    "checkout_option": "Payment",
                    "value": $('[name="radio_payment"]').val().replace($('[name="radio_payment"]').val().split(',')[0] + ',', '')
                });
            })
        }

        if ($('body').attr("data-template") == "payresult") {
            var orderitems = [];
            $.each($('[data-type="orderitem"]'), function () {
                orderitems.push({
                    "id": $(this).attr("data-productid"),
                    "name": $(this).attr("data-productname"),
                    "list_name": "checkout",
                    "variant": $(this).attr("data-variant"),
                    "quantity": $(this).attr("data-quantity"),
                    "price": $(this).attr("data-price")
                });
            });
            if (orderitems.length > 0) {
                gtag('event', 'purchase', {
                    "transaction_id": $('[data-type="orderdetail"]').attr("data-ordernumber"),
                    "affiliation": $('[data-type="orderdetail"]').attr("data-website"),
                    "value": $('[data-type="orderdetail"]').attr("data-totalprice"),
                    "currency": "USD",
                    "shipping": $('[data-type="orderdetail"]').attr("data-shipping"),
                    "items": orderitems
                });
            }
        }
    }
}


function ContactUs() {
    if ($("[name='txt_messagevalidcode']").length > 0 && $("[name='txt_messagevalidcode']").val() == "") {
        alert(Shopify.languagejson.contact_validation_validcode_required);
        return;
    }
    if ($("[name='txt_email']").val() == "") {
        alert(Shopify.languagejson.contact_validation_email_required);
        return;
    }
    if ($("[name='txt_title']").val() == "") {
        alert(Shopify.languagejson.contact_validation_title_required);
        return;
    }
    if ($("[name='message']").val() == "") {
        alert(Shopify.languagejson.contact_validation_content_required);
        return;
    }
    var formid = "", type = "";
    if (GetQueryString("type") != null)
        type = GetQueryString("type");
    if (GetQueryString("formid") != null)
        formid = GetQueryString("formid");
    $.post("/Submit/ajaxrequest.ashx?cmd=ContactUs", {
        txt_messagevalidcode: $("[name='txt_messagevalidcode']").val(),
        txt_email: $("[name='txt_email']").val(),
        txt_title: $("[name='txt_title']").val(),
        message: $("[name='message']").val(),
        type: $("[name='type']").val(),
        formid: formid,
        txt_name: $("[name='txt_name']").val(),
        txt_tele: $("[name='txt_tele']").val(),
        type: type

    }, function (data) {
        if (data.success) {
            $("[name='message']").val("");
            $('[name="txt_messagevalidcode"]').val("");
            $('#vcode').click();
        }
        else {
            if (data.message != "contact_validation_validcode_wrong")
                $('#vcode').click();
            else
                $('[name="txt_messagevalidcode"]').val("");
        }
        var message = Shopify.languagejson[data.message];
        if (message == undefined) {
            if (data.success) {
                message = "Thank you! We'll be in touch with you shortly.";
            } else {
                message = "Sorry,Leave a message failed,please try again.";
            }
        }
        alert(message);
    }, 'json');
}

function GetQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}


function register() {
    if ($("#reg_submit [name=txt_passwords]").val() != $("#reg_submit [name=txt_password]").val()) {
        if ($(".RegistrationConfig").length > 0) {
            var title = convertLanguage("changepassword_validation_password_confirm", "Your New and Verified passwords do not match, try again.");
            ShakyValid(title);
            return false;
        } else {
            alert(convertLanguage("changepassword_validation_password_confirm", "Your New and Verified passwords do not match, try again."));
            return false;
        }
    }
    //valid data
    if ($(".RegistrationConfig").length > 0) {
        if ($(".RegistrationConfig").find(".checkedAgreement").length > 0) {
            if ($("input[type='checkbox'][name='agreement']:checked").val() == undefined || $("input[type='checkbox'][name='agreement']:checked").val() == "") {
                //alert(convertLanguage("message_agree_treaty", "Must agree to the registration agreement"));
                var title = convertLanguage("message_agree_treaty", "Must agree to the registration agreement");
                ShakyValid(title);
                return false;
            }
        }

        if ($('select[name="location"]').length > 0) {
            if ($('select[name="location"]').parents("div").next().children("input").attr("required")) {
                if ($('select[name="location"]').val() == $('select[name="location"] option[value="0"]').val()) {
                    //alert(convertLanguage("message_country_required", "country is required"));
                    var title = convertLanguage("message_country_required", "country is required");
                    ShakyValid(title);
                    return false;
                }
            }
        }
        return VerificationInfo();
    }

}

function VerificationInfo() {
    var result = true;
    $.ajaxSettings.async = false;
    $.get("/Submit/VerifyRegistrationInfo.ashx?cmd=VerificationInfo", $("form").serialize(),
        function (data) {
            var title = "";
            data = JSON.parse(data)
            if (data.success == false) {
                if (data.message) {
                    errorMsg = JSON.parse(data.message)
                    var resultMsg1 = errorMsg.firstname;
                    var resultMsg2 = errorMsg.lastname;
                }
                //alert(convertLanguage("message_isrequired", "{0} is required"));
                if (resultMsg1 && resultMsg2) {
                    title = resultMsg1 + "\n" + resultMsg2;
                } else if (resultMsg1) {
                    title = resultMsg1;
                } else {
                    title = resultMsg2;
                }
                //var title = convertLanguage("message_isrequired", "{0} is required");
                ShakyValid(title);
                result = false;
            }
        }
    );
    $.ajaxSettings.async = true;
    return result;
}

function TimeLinkage(obj) {
    if (obj.length > 0) {
        obj.each(function () {
            var yearInput = $(this).find('[name="year"]');
            var monthInput = $(this).find('[name="month"]');
            var dayInput = $(this).find('[name="day"]');
            var yearVal = yearInput.val();
            var monthVal = monthInput.val();
            var dayVal = dayInput.val();
            var now = 1;
            yearInput.unbind("change");
            monthInput.unbind("change");
            dayInput.unbind("change");

            var initialDate = new Date();

            var setUpInitTime = true;
            if (yearInput.val() != null && monthInput.val() != null && dayInput.val() != null) {
                setUpInitTime = false;
            }
            //var days = 0;
            years();
            months();

            Days();
            if (setUpInitTime) {
                yearInput.val(initialDate.getFullYear());
                monthInput.val((initialDate.getMonth() + 1));
                dayInput.val(initialDate.getDate());
            } else {
                yearInput.val(yearVal);
                monthInput.val(monthVal);
                dayInput.val(dayVal);
            }


            yearInput.change(function () {
                months();
                Days();
            });

            monthInput.change(function () {
                Days();
            });

            function years() {
                yearInput.empty();
                var str = "<option value=''>" + convertLanguage("message_year", "year") + "</option>";
                yearInput.append(str);
                for (var i = 1900; i <= initialDate.getFullYear(); i++) {
                    str = "<option value=" + i + ">" + i + "</option>";
                    yearInput.append(str);
                }
            }

            function months() {
                monthInput.empty();
                var str = "<option value=''>" + convertLanguage("message_month", "month") + "</option>";
                monthInput.append(str);
                for (var i = 1; i <= 12; i++) {
                    str = "<option value=" + i + ">" + i + "</option>";
                    monthInput.append(str);
                }
            }

            function Days() {
                dayInput.empty();
                now = 0;
                var mon = parseInt(monthInput.val());
                if (isNaN(mon)) {
                    now = initialDate.getMonth() + 1;
                }
                if (parseInt(monthInput.val()) == 1 || parseInt(monthInput.val()) == 3 || parseInt(monthInput.val()) == 5 || parseInt(monthInput.val()) == 7 || parseInt(monthInput.val()) == 8 || parseInt(monthInput.val()) == 10 || parseInt(monthInput.val()) == 12 || now == 1 || now == 3 || now == 5 || now == 7 || now == 8 || now == 10 || now == 12) {
                    days = 31;
                } else if (parseInt(monthInput.val()) == 4 || parseInt(monthInput.val()) == 6 || parseInt(monthInput.val()) == 9 || parseInt(monthInput.val()) == 11 || now == 4 || now == 6 || now == 9 || now == 11) {
                    days = 30;
                } else {
                    if (parseInt(yearInput.val()) % 400 == 0 || (parseInt(yearInput.val()) % 4 == 0 && parseInt(yearInput.val()) % 100 != 0)) {
                        days = 29;
                    } else {
                        days = 28;
                    }
                }
                var str = "<option value=''>" + convertLanguage("message_day", "day") + "</option>";
                dayInput.append(str);
                for (var i = 1; i <= days; i++) {
                    str = "<option value=" + i + ">" + i + "</option>";
                    dayInput.append(str);
                }
            }
        })
    }
}

function ShakyValid(title) {
    var math = Math.ceil(Math.random() * 100);
    var str = '<div class="donghua donghua' + math + '"><span class="iconfont icon-kulian"></span><span class="text_txt">' + title + '</span></div>';
    $(".shaky").append(str);
    $(".donghua" + math).css("left", "0px");
    var left = (document.body.offsetWidth - $(".donghua" + math).outerWidth()) / 2;
    $(".donghua" + math).css("left", left + "px");
    var donghua = setTimeout(function () {
        $(".donghua" + math + "").remove();
    }, 2500);
}

function remove_total_num() {
    if ($('.total_num ').parent().parent().hasClass('pc_num_box')) {
        if ($('.total_num').text() == 0) {
            $('.total_num').text("")
            if (($('.total_num')).hasClass('plus_nine')) {
                $('.total_num').removeClass('plus_nine')
            }
        } else if ($('.total_num').data('num') >= 99) {
            $('.total_num').text("99")
            if (!($('.total_num')).hasClass('plus_nine')) {
                $('.total_num').addClass('plus_nine')
            }
        }
    }
}

$(function () {
    var pageTemplate = $("body[data-template='register']");
    if (pageTemplate.length > 0) {
        $.each($(".form-group .title"), function () {
            if ($(this).hasClass("hide")) {
                var objinput = $(this).next("div").children("input:eq(0),textarea");
                objinput.attr("placeholder", objinput.data("title"));
            }
        });
        TimeLinkage($(".timeLinkageBox"));
    }
})

function SetDefaultAddress(id, obj) {
    if (confirm("Whether to set as default address?")) {
        $.post("/Submit/ajaxrequest.ashx?cmd=SetDefaultAddress", { defaultaddressid: id }, function (data) {
            if (data.result) {
                $('.btn-setdefaddress').show();
                $(obj).hide();
            } else {
                alert("{{language.customer_address_delete_failed}}");
            }
        }, 'json');
    }
}

function numAdd(num1, num2) {
    return (num1 * 1000 + num2 * 1000) / 1000;
}

function numMulti(num1, num2) {
    return ((num1 * 1000) * (num2 * 1000)) / 1000;
}

function OrderTransactionInfoSubmit() {
    if ($('#transactionid').val() == '') {
        return;
    } else {
        if ($('#transactionid').val() == $('#old_transactionid').val()) {
            var message = Shopify.languagejson["repeated_sub"];
            if (message == undefined) {
                message = "Please do not resubmit";
            }
            alert(messag + "!");
            return;
        } else {
            $.post("/Submit/ajaxrequest.ashx?cmd=OrderTransactionInfoSubmit", {
                orderid: $('#input_orderid').val(),
                paymentid: $('#input_paymentid').val(),
                transactionid: $("#transactionid").val()
            }, function (data) {
                if (data.result) {
                    $('#old_transactionid').val($("#transactionid").val());
                    location.reload();
                } else {
                    var message = Shopify.languagejson[data.message];
                    if (message == undefined) {
                        switch (data.message) {
                            case "param_err":
                                message = "Parameter error";
                                break;
                            case "paymethod_err":
                                message = "Incorrect payment method";
                                break;
                            case "datasubmit_err":
                                message = "Data submission error";
                                break;
                            case "order_state_err":
                                message = "Order status error";
                                break;
                            case "order_not_exist":
                                message = "Order does not exist";
                                break;
                            case "repeated_sub":
                                message = "Please do not resubmit";
                                break;
                        }
                    }
                    alert(message);
                }
            }, 'json');
        }
    }
}
$(function () {
    $.each($('.div-buybutton'), function () {
        var obj = $(this);
        $.post('/submit/ajaxrequest.ashx?cmd=ProductInfo', { productid: obj.data('id') }, function (data) {
            let dataPro = JSON.parse(data);
            dataPro.product.price = getCurrency(dataPro.product.price);
            let wrapper = "<div class='wrapper-pro'>";
            let productdata = `<div class='p-img'><img src="${dataPro.product.featuredimage.src}" /></div><h1 class="p-title">${dataPro.product.name}</h1><div class="p-price">${dataPro.product.price}</div><div class="p-view-more"><a class="btn btn-primary"  onclick="showModal(${dataPro.product.id},'${dataPro.product.url}')" data-toggle="modal" data-target="#myModal">View product</a ></div>`;
            wrapper += productdata;
            wrapper += "</div>"
            obj.html(wrapper);
        });
    })
})
function showModal(dataId, url_href) {
    $('.product-modal').empty()
    $('.loader').show()
    $('.overlay').show()
    $('#myModal').modal('hide')
    $.ajax({
        type: 'Get',
        url: location.origin + `/p${dataId}.html`,
        success: function (response) {
            $('.loader').hide()
            $('.overlay').hide()
            $('.product-modal').empty()
            $('.product-modal').html(response)
            $('.product-view-detail').attr('href', url_href);
        },
        error: function (x, e) {
            if (x.status == 500 || x.status == 404) {
                alert("no data found");
            }
        }
    });
}
function convert(str) {
    return str;
}

function lanng_sign_out() {
    if ($.cookie("usermail").length > 0) {
        if (confirm(convertLanguage("customer_confirm_logout", "Whether to quit?"))) {
            $.cookie("usermail", "", { path: '/', expires: -1 });
            $.cookie("affiliateid", "", { path: '/', expires: -1 });
            window.location.href = basepath + "/login";
        }
    }
}
function bindGroupCheckbox(target) {
    $(document).off('change', `${target} .ckb_allitem, ${target} [name="ckb_cartitem"]`);
    $(document).on('change', `${target} .ckb_allitem`, function () {
        const $allCheckbox = $(this);
        const $group = $allCheckbox.closest(target);
        const isChecked = $allCheckbox.prop('checked');

        $('[name="ckb_cartitem"]').prop('checked', isChecked);
        $('.ckb_allitem').prop('checked', isChecked);
        ajax_lodding();
    });
    $(document).on('change', `${target} [name="ckb_cartitem"]`, function () {
        const $childCheckbox = $(this);
        const $group = $childCheckbox.closest(target);
        const $allCheckbox = $('.ckb_allitem');
        const $childCheckboxes = $group.find('[name="ckb_cartitem"]');

        const allChecked = $childCheckboxes.length === $childCheckboxes.filter(':checked').length;
        $allCheckbox.prop('checked', allChecked);
        const isChecked = $childCheckbox.prop('checked');
        var data = $childCheckbox.data();
        $('[name="ckb_cartitem"][data-productid="' + data.productid + '"][data-skuid="' + data.skuid + '"][data-optionsskuid="' + data.optionsskuid + '"]').prop('checked', isChecked);
        ajax_lodding();
    });
}
$(function () {
    if (typeof(chectoutpage) != "undefined" && chectoutpage == "/checkoutnew") {
        if ($('.cart_model').length != 0)
            bindGroupCheckbox('.cart_model');
        else
            bindGroupCheckbox('.pc_cart_list');
        bindGroupCheckbox('.cart_list');
    }
});