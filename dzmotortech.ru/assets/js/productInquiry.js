function AddToInquiryCart(obj) {
    var $obj = $(obj);
    var $btn = $obj.addClass("btn_ajax").button('loading');
    var optionsets = getProductParams()
    var sku = $("#sku_id").val();
    var prodcutid = $("#prodcutid").val();
    var num = $("#txtinquiry_num").val();
    if ( /\/inquiry$/.test($obj.data("url"))) {
        var url = "";
        var inquiryurl = $obj.data("url");        
        if (typeof appliedOptionSets != "undefined") {
            if (appliedOptionSets.length > 0) {
                if (validateForm(formElement, quantityInput)) {
                    optionsets.options = JSON.stringify(optionsets.options)
                    setSingleProductCheckOutOptionResult = false;
                    var optionId = guidnew();
                    $.ajax({
                        type: "POST",
                        url: "/Submit/AjaxInquiryRequest.ashx?cmd=SetSingleProductInquiryOption",
                        async: false,
                        dataType: 'json',
                        data: { optionid: optionId, options: optionsets.options },                      
                        beforeSend: function (XMLHttpRequest) {
                        },
                        success: function (data, textStatus) {
                            setSingleProductCheckOutOptionResult = data.result;
                        },
                        complete: function (XMLHttpRequest, textStatus) {
                        },
                        error: function () {
                        }
                    });
                    if (setSingleProductCheckOutOptionResult)
                        url = inquiryurl + "?productid=" + prodcutid + '&skuid=' + sku + "&qty=" + num + "&option=" + optionId
                } else {
                    setSingleProductCheckOutOptionResult = false;
                    $btn.button('reset');
                    alert("fail");
                    return
                }
            } else {
                url = inquiryurl + "?productid=" + prodcutid + '&skuid=' + sku + "&qty=" + num;
            }
        } else {
            url = inquiryurl + "?productid=" + prodcutid + '&skuid=' + sku + "&qty=" + num;
        }
        $btn.removeClass("btn_ajax").button('reset');
        window.location.href = url;
        return false;
    }


    if ((typeof validateForm != "function") || (typeof validateForm == "function" && validateForm(formElement, quantityInput))) {
        if (typeof validateForm == "function" && optionsets.options.length > 0) {
            optionsets.options = JSON.stringify(optionsets.options)
        } else {
            optionsets.options = ""
        }


        $.ajax({
            type: "POST",
            url: "/Submit/AjaxInquiryRequest.ashx?cmd=InquiryCartItemUpdate&t=add&sku_id=" + escape(texttohtml(sku)).replace(/\+/g, '%2B').replace('%D7', '%c3%97') + "&prodcutid=" + prodcutid + "&num=" + num,            
            data: { options: optionsets.options },
            beforeSend: function (XMLHttpRequest) {

            },
            success: function (data, textStatus) {
                if (data == "True") {
                    if ($obj.attr("data-url")) {
                        $btn.button('reset');
                        window.location.href = $obj.attr("data-url");
                    } else {

                        if ($obj.attr("data-modal")) {
                            $($obj.attr("data-modal")).modal('show');
                        }
                        if ($obj.attr("data-model")) {
                            $($obj.attr("data-model")).addClass("on").hover(function () {
                                $(this).removeClass("on");
                            });
                        }
                        if ($obj.attr("data-alert") == "") {

                        }
                        if ($obj.attr("data-alert")) {
                            alert($obj.attr("data-alert"));
                        }
                    }
                    GetInquiryCartDetail();
                    $(".inquiry_model").modal("show");
                } else {
                    $("#model_alert").find(".mod_code").text(convertLanguage("inquiry_failed_add_inquiry_cart"));
                    $("#model_alert").modal("show");
                    $(".inquiry_model").modal("hide");
                }
                $btn.removeClass("btn_ajax").button('reset');
            },
            complete: function (XMLHttpRequest, textStatus) {

            },
            error: function () {
                $btn.removeClass("btn_ajax").button('reset');
            }
        });

    } else {
        $btn.removeClass("btn_ajax").button('reset');
        //alert("failed")
        return
    }


}

function add_product(item){
  var html = '';
  let optionHtml = '';
  let originHtml = "";
  if (item.Options && item.Options.length > 0) {

  $(item.Options).each(function (idx, items) {
  optionHtml += "<div class='optionDiv'>";
    optionHtml += items.html;
    if (items.price > 0) {
    optionHtml += ("<span class='optionprice'>" + getCurrency(items.price) + "</span>");
    }
    optionHtml += "</div>";
  })

  }


  /*if (item.V == "" || item.V == null) {
  originHtml = `<div class="optionDiv"><div class="itemOption" style="line-height: normal;"><a href="${item.Url}" title="${item.Name}">${item.Name}</a></div>`
    if (item.OptionsPrice != 0) {
    originHtml += ` <span class="optionprice">${getCurrency(item.BasePrice)}</span></div>`
  } else {
  originHtml += `</div>`
  }
  }else {
  originHtml = `<a href="${item.Url}" title="${item.Name}">${item.Name}</a><div class="optionDiv"><div class="itemOption"><span class="originAttr">${item.V.replace(/卍/g, ",")}</span></div>`
    if (item.OptionsPrice != 0) {
    originHtml += ` <span class="optionprice">${getCurrency(item.BasePrice)}</span></div>`
  } else {
  originHtml += `</div>`
  }
  }*/ 

  let optionSkuId = item.OptionsSkuId
  if (optionSkuId == null) {
    optionSkuId = ""
  }




  console.log(item)


  html += '<li><div class="product_inquiry" data-skuid="'+item.SI+'" data-optionsskuid="'+ optionSkuId +'"  data-id="'+item.PI+'"style="padding: 15px 5px;">'
        html += '<div style="width: 80px;display: inline-block;"><a  href='+item.Url+' target="_blank"><img src="'+item.PicUrl+'" /></a></div>'
        html += '<div style="display: inline-block;width: 160px;vertical-align: middle;line-height: 16px;"><div style="display: -webkit-box;margin-bottom: 5px;" title='+item.Name+'><a  href='+item.Url+' target="_blank">'+item.Name+'</a></div><div><div style="margin-bottom: 5px;">'+ convertLanguage("product_general_quantity_colon","Quantity: ") + ''+item.Number+'</div><div class="removeSp" style="margin-bottom: 5px;">Specifications:'+item.Variant.replace("卍",",")+'</div></div>'
          html += originHtml
          html += optionHtml
          //html += '<div style="display: inline-block;width: 160px;vertical-align: middle;line-height: 16px;"><div style="display: -webkit-box;margin-bottom: 5px;" title='+item.Name+'><a  href='+item.Url+' target="_blank">'+item.Name+'</a></div><div><div>{{language.product_general_quantity_colon}}'+item.Number+'</div>'+ item.Variant ? '<div>Specifications:'+item.Variant.replace("卍",",")+'</div>':'<div class="hide">Specifications:'+item.Variant.replace("卍",",")+'</div>' +'</div>'
        if (DisplaySiteInquirySetting.showprice){
        	 html += '<div>Price:'+ item.PR+'</div>'
        }
        html +='</div>'
        html +='<div onclick="DeleteInquiryItems(\''+item.SI+'\','+item.PI+',\''+ optionSkuId +'\')" style="padding-left: 20px;display: inline-block;"><span class="glyphicon glyphicon-trash delete_inquiryItem" ></span></div></div></li>'
        $(".pc_cart_list").removeClass("no_data");
        $(".pc_inquiry_list ul").append(html);
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
function DeleteInquiryItems(skuid, productid, optionsskuid) {
    var $deleteNode = $(".pc_inquiry_list ul").find(".product_inquiry[data-skuid='" + skuid + "'][data-id='" + prodcutid + "']");	
    $.post("/Submit/AjaxInquiryRequest.ashx?cmd=InquiryCartRemoveItem", {
		sku_id: skuid, productid: productid, optionsskuid: optionsskuid
    }, function (data) {
        data = $.parseJSON(data);
        if (data.success == true) {
            $deleteNode.parentsUntil('.pc_inquiry_list ul').remove();
            GetInquiryCartDetail();
        }
    })
}