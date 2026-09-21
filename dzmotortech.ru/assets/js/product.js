$(document).ready(function () {
if (Shopify.products[0].onsale && Shopify.products[0].variantgroups == null && (Shopify.products[0].ignorestock || (Shopify.products[0].stock > 0 && (Shopify.products[0].pricerange == null || Shopify.products[0].pricerange[0].qty <= Shopify.products[0].stock)))) {
    $('#smart-button-container_mask').hide()
}
    isLazyImg = $(".lazyload")
    sku_select_xml();


    $(".preview_pic").each(function (index, element) {
        $(this).find("li:eq(0)").click();
    });

    $(document).on("click", ".preview_pic ul li", function () {
        let nums = $(this).data('nums')
        let nums_src = $(this).find('img').data('url');
        let nums_width = $('.main_pic li:eq(0)').width()
        $('.main_pic #img_slidebox_' + nums + '').find('img').attr('srcset', nums_src)
        $('.main_pic').css("transform", "translate(" + (-(nums_width * nums)) + "px, 0px) translateZ(0px)")
    });

    $("#nums_bks").on("click", "i", function () {
        let $obj = $(this).siblings("input");
        let suns = parseInt($obj.val());
        if (isNaN(suns)) {
            suns = 1;
        }
        if ($(this).hasClass("num_n")) {
            suns = suns - 1;
        } else {
            let obj_max = suns + 1;
            if ($obj.attr("max") >= obj_max) {
                suns = suns + 1;
            } else {
                suns = $obj.attr("max");
            }
        }
        if (suns >= $obj.attr("min")) {
            $obj.val(suns);
        } else {
            $obj.val($obj.attr("min"));
        }
        QtyDiscount();
    }).find("input").change(function () {
        let max_val = parseInt($(this).attr("max"));
        let min_val = parseInt($(this).attr("min"));
        let this_val = parseInt($(this).val());
        if (isNaN(this_val)) {
            this_val = 1;
        }
        if (max_val < this_val) {
            $(this).val(max_val);
        } else if (this_val < min_val) {
            $(this).val(min_val);
        } else {
            $(this).val(this_val);
        }
        QtyDiscount();
    })

});

function QtyDiscount() {
    var price = Shopify.products.length == 0 ? $('[itemprop="price"]').attr('content') : (Shopify.products[0].price || $('[itemprop="price"]').attr('content'));
    var num = $("[name=txt_num]").val(), price_obj = price, ul_sku_list = [],
        price_obj;
    let addtionalTemp = 0
    let additionalPrice = convertMoneyToNumber($(".tpo_total-additional-price").attr("extra"))
    $("#ul_skulist ul .select").each(function (index, element) {
        ul_sku_list.push($(this).attr("attrid"));
    });
    if (sku_list != null) {
        $.each(sku_list, function (index, obj) {
            if (obj.variantids.sort().toString() == ul_sku_list.sort().toString()) {
                price_obj = obj.price;
                price = obj.price;
            }
        })
    }
    if (Shopify.products.length != 0 && Shopify.products[0].pricerange != undefined && Shopify.products[0].pricerange != null) {
        $.each(Shopify.products[0].pricerange, function (index, obj) {
            if (obj.qty <= num) {
                if (Shopify.products[0].rangediscounttype == 1) {
                    price = price_obj * obj.discount;
                    addtionalTemp = additionalPrice * obj.discount
                    price += addtionalTemp;
                }
                else {
                    price = price_obj - obj.discount;
                    if (price < 0)
                        price = 0;
                    price += additionalPrice;
                }
            }
        })
    } else {
        price += additionalPrice
    }
    price_obj = (Shopify.currency[0].rate * price).toFixed(2);
    $("#f_price").text(Shopify.currency[0].tags + price_obj);
    $(".total_price span").text(Shopify.currency[0].tags + (price_obj * num).toFixed(2));
}

// 获取折后价格
function handleDiscount(price) {
    let num = $("[name=txt_num]").val();
    let tempPrice = price

    if (Shopify.products[0].pricerange != null) {
        $.each(Shopify.products[0].pricerange, function (index, item) {
            if (item.qty <= num) {
                if (Shopify.products[0].rangediscounttype == 1)
                    price = tempPrice * item.discount;
                else {
                    price = tempPrice - item.discount;
                    if (price < 0)
                        price = 0;
                }
            }
        })
    }
    return price
}


function getProductParams(obj) {
    let sku = $("#sku_id").val();
    let productId = $("#prodcutid").val();
    let num = $("#txt_num").val();
    let productOptions = {
        t: "add",
        sku_id: sku,
        productid: productId,
        options: [],
        num

    }
    if ($(".tpo_total-additional-price").length > 0) {
        let totalPrice = convertMoneyToNumber($(".tpo_total-additional-price").attr("extra") == undefined ? "" : $(".tpo_total-additional-price").attr("extra"))
        productOptions.options_price = totalPrice;
        productOptions.options = GetOptions();
    }


    return productOptions
}

function GetOptions(forcheck) {
    var listElements;
    if (forcheck) {
        listElements = allElementOptions.map((id) => {
            const element = document.getElementById(id);
            return element;
        });
    }
    else {
        listElements = allElementOptions.map((id) => {
            const element = document.getElementById(id);
            if (!element.parentElement.classList.contains('tpo_hidden'))
                return element;
        }).filter((element) => { return element != undefined });;
    }
    let options = [];
    const optionsElements = listElements.map((option) => {
        let optionId = option.getAttribute("id").split(",")[0];
        let optionType = option.getAttribute("id").split(",")[1]

        let regExp = /\[(.*)\]$/;
        switch (optionType) {
            case 'input':
            case 'textArea':
            case 'numberInput':
                let optionValueInput = $(option).find(".tpo_option-input.tpo_text-box.tpo_optionValue").val()
                let tempVariable = optionValueInput && regExp.exec(optionValueInput)
                let optionLabel = $(option).find(".form-label.tpo_family-optionSetting").text()
                optionValueInput = optionValueInput.replace(tempVariable && tempVariable[0], "").trim()

                let htmlTemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionLabel}: </label><span class="itemValue">${optionValueInput}</span></div>`

                let optionElementInput = {
                    id: optionId,
                    value: optionValueInput,
                    html: htmlTemplate,
                }
                if (optionElementInput.value.trim()) {
                    if (!$(option).parent().hasClass("tpo_hidden"))
                        options.push(optionElementInput)
                }
                break;
            case 'colorSwatches':
                let optionValueColorSwatches = "";
                let optionNameColorSwatchesElement = $(option).find(".tpo_color-swatches-label_position");
                let optionColorLabel = $(option).find(".form-label.tpo_family-optionSetting").text();
                let htmlColorTemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionColorLabel}: </label>`;

                let optionNameColorSwatchesElementFilter = optionNameColorSwatchesElement.filter(function (index, item) {
                    return $(item).find("label").hasClass("tpo_is_checked_swatches")
                })

                optionNameColorSwatchesElementFilter.each(function (index, item) {
                    let colorSpan = $(item).find(".tpo_is_checked_swatches").find("span")
                    let singleColor = ""
                    let doubleColor = []
                    let double = ""
                    if (colorSpan.length === 1) {
                        singleColor = $(colorSpan).attr("style")
                    } else {
                        $(colorSpan).each(function (i, res) {
                            doubleColor.push($(res).attr("style"))
                        })
                        double = doubleColor[0] + ';' + doubleColor[1]
                    }
                    if (optionNameColorSwatchesElementFilter.length - 1 === index) {
                        optionValueColorSwatches += $(item).find(".tpo_color-swatches-input").attr("id")
                        htmlColorTemplate += `<label class="colorChecked" style="width: 20px; height: 20px; display: inline-block"><span class="itemValue" style="${singleColor ? singleColor : double}; width: 20px; height: 20px; display: inline-block"></span></label>`
                    } else {
                        optionValueColorSwatches += $(item).find(".tpo_color-swatches-input").attr("id") + ","
                        htmlColorTemplate += `<label class="colorChecked" style="width: 20px; height: 20px; display: inline-block"><span class="itemValue" style="${singleColor ? singleColor : double}; width: 20px; height: 20px; display: inline-block">&nbsp;</span></label>`
                    }
                })

                htmlColorTemplate += "</div>"

                let optionElementColorSwatches = {
                    id: optionId,
                    value: optionValueColorSwatches,
                    html: htmlColorTemplate,
                }
                if (optionElementColorSwatches.value.length > 0) {
                    if (!$(option).parent().hasClass("tpo_hidden"))
                        options.push(optionElementColorSwatches)
                }
                break
            case 'imageSwatches':
                let optionNameImageSwatches = $(option).find(".form-label.tpo_family-optionSetting").text()
                let optionValueImageSwatches = ""

                let optionNameImageSwatchesElement = $(option).find(".tpo_swatches-label_position")
                let optionImageSwatchesELabel = $(option).find(".form-label.tpo_family-optionSetting").text()

                let optionNameImageSwatchesElementFilter = optionNameImageSwatchesElement.filter(function (index, item) {
                    return $(item).find("label").hasClass("tpo_is_checked_swatches")
                })

                let htmlImageSwatchesETemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionImageSwatchesELabel}: </label>`;

                optionNameImageSwatchesElementFilter.each(function (index, item) {
                    let imageSrc = $(item).find(".tpo_is_checked_swatches").find("img").attr("src")
                    if (optionNameImageSwatchesElementFilter.length - 1 === index) {
                        optionValueImageSwatches += $(item).find(".tpo_color-swatches-input").attr("id")
                        htmlImageSwatchesETemplate += `<span class="itemValue"><a href="${imageSrc}" target="_blank"><img src="${imageSrc}" /></a></span>`
                    } else {
                        optionValueImageSwatches += $(item).find(".tpo_color-swatches-input").attr("id") + ","
                        htmlImageSwatchesETemplate += `<span class="itemValue"><a href="${imageSrc}" target="_blank"><img src="${imageSrc}" /></a>&nbsp;</span>`
                    }
                })

                htmlImageSwatchesETemplate += "</div>"

                let optionElementImageSwatches = {
                    id: optionId,
                    value: optionValueImageSwatches,
                    html: htmlImageSwatchesETemplate
                }
                if (optionElementImageSwatches.value.length > 0) {
                    if (!$(option).parent().hasClass("tpo_hidden"))
                        options.push(optionElementImageSwatches)
                }
                break
            case 'radio':
                let optionNameRadioElement = $(option).find(".tpo_radio-button-wrapper")
                let optionRadioLabel = $(option).find(".form-label.tpo_family-optionSetting").text()

                let optionNameRadioElementFilter = optionNameRadioElement.filter(function (index, item) {
                    return $(item).find("input[type='radio']:checked").length > 0
                })
                let optionElementRadioValue = $(optionNameRadioElementFilter).find(".tpo_radio-button.tpo_checked").attr("id") || ""
                let optionRadioValue = $(optionNameRadioElementFilter).find(".tpo_radio-button.tpo_checked").val();
                let htmlRadioTemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionRadioLabel}: </label><span class="itemValue">${optionRadioValue}</span></div>`;

                let optionElementRadio = {
                    id: optionId,
                    value: optionElementRadioValue,
                    html: htmlRadioTemplate,
                }
                if (optionElementRadio.value.trim()) {
                    if (!$(option).hasClass("tpo_hidden"))
                        options.push(optionElementRadio)
                }
                break
            case 'buttons':
                let optionNameButtons = $(option).find(".form-label.tpo_family-optionSetting").text()
                let optionNameButtonsElement = $(option).find(".tpo_buttons-wrapper")
                let optionButtonsLabel = $(option).find(".form-label.tpo_family-optionSetting").text()
                let htmlButtonsTemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionButtonsLabel}: </label>`;

                let optionValueButtons = ""
                let optionNameButtonsElementFilter = optionNameButtonsElement.filter(function (index, item) {
                    return $(item).find("label").hasClass("tpo_is_checked_buttons")
                })

                optionNameButtonsElementFilter.each(function (index, item) {
                    let buttonsLabel = $(item).find(".tpo_is_checked_buttons").find("input").val()
                    if (optionNameButtonsElementFilter.length - 1 === index) {
                        optionValueButtons += $(item).find(".tpo_buttons-input").attr("id")
                        htmlButtonsTemplate += `<span class="itemValue">${buttonsLabel}</span>`
                    } else {
                        optionValueButtons += $(item).find(".tpo_buttons-input").attr("id") + ","
                        htmlButtonsTemplate += `<span class="itemValue">${buttonsLabel}, </span>`
                    }
                })

                htmlButtonsTemplate += `</div>`

                let optionElementButtons = {
                    id: optionId,
                    value: optionValueButtons,
                    html: htmlButtonsTemplate,
                }
                if (optionElementButtons.value.length > 0) {
                    if (!$(option).parent().hasClass("tpo_hidden"))
                        options.push(optionElementButtons)
                }
                break
            case 'checkBox':
                let optionNameCheckBox = $(option).find(".form-label.tpo_family-optionSetting").text()
                let optionNameCheckBoxElement = $(option).find(".tpo_radio-button-wrapper")

                let optionCheckBoxLabel = $(option).find(".form-label.tpo_family-optionSetting").text()
                let htmlCheckBoxTemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionCheckBoxLabel}: </label>`;

                let optionValueCheckBox = ""
                let optionNameCheckBoxElementFilter = optionNameCheckBoxElement.filter(function (index, item) {
                    return $(item).find("input[type='checkbox']:checked").length > 0
                })

                optionNameCheckBoxElementFilter.each(function (index, item) {
                    let checkLabel = $(item).find(".tpo_under_option_type").find("span").text()
                    if (optionNameCheckBoxElementFilter.length - 1 === index) {
                        optionValueCheckBox += $(item).find(".tpo_radio-button").attr("id")
                        htmlCheckBoxTemplate += `<span class="itemValue">${checkLabel}</span>`
                    } else {
                        optionValueCheckBox += $(item).find(".tpo_radio-button").attr("id") + ","
                        htmlCheckBoxTemplate += `<span class="itemValue">${checkLabel}, </span>`
                    }
                })

                htmlCheckBoxTemplate += `</div>`

                let optionElementCheckBox = {
                    id: optionId,
                    value: optionValueCheckBox,
                    html: htmlCheckBoxTemplate,
                }
                if (optionElementCheckBox.value.length > 0) {
                    if (!$(option).parent().hasClass("tpo_hidden"))
                        options.push(optionElementCheckBox)
                }
                break
            case 'dropdown':
                let optionNameDropdownElement = $(option).find(".tpo_option-input-wrapper")
                let optionValueDropdown = optionNameDropdownElement.find(".tpo_option-input.tpo_optionSetting.tpo_option-dropdown").val()
                let optionValueDropdown2 = optionNameDropdownElement.find(".tpo_option-input.tpo_optionSetting.tpo_option-dropdown").attr("id")
                let imgSrc = ""
                let spanText = ""

                if (optionValueDropdown2) {
                    let optionDropDownWrapper = $(option).find(".tpo_option-type-dropdown-wrapper")
                    let tempDropDown = optionDropDownWrapper.find("button").filter(function (index, item) {
                        return $(item).attr("id") === optionValueDropdown2
                    })
                    if (tempDropDown.find("img").length > 0) {
                        imgSrc = tempDropDown.find("img").attr("src")
                    }
                    spanText = tempDropDown.find("span#" + tempDropDown.attr("id")).text()
                }

                let optionDropdownLabel = $(option).find(".form-label.custom-family").text()
                let imgTemplate = `<span class="itemValue"><a href="${imgSrc}" target="_blank"><img src="${imgSrc}" alt="${optionDropdownLabel}" /></a></span>`
                let htmlDropdownTemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionDropdownLabel}: </label>${imgSrc !== "" ? `${imgTemplate}` : ""}<span class="itemValue"> ${spanText}</span></div>`;

                let tempVariableDropdown = optionValueDropdown && regExp.exec(optionValueDropdown)
                optionValueDropdown = optionValueDropdown.replace(tempVariableDropdown && tempVariableDropdown[0], "").trim()

                let optionElementDropdown = {
                    id: optionId,
                    value: optionValueDropdown2,
                    html: htmlDropdownTemplate
                }
                if (optionElementDropdown.value && optionElementDropdown.value.trim()) {
                    if (!$(option).parent().hasClass("tpo_hidden"))
                        options.push(optionElementDropdown)
                }
                break
            case 'switch':
                let activeSwitch = $(option).find(".tpo_additional-price.absolute")
                let temp = ""
                let optionSwitchLabel = $(option).find(".form-label.tpo_family-optionSetting").text()
                let htmlSwitchTemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionSwitchLabel}: </label>`
                if ($(option).find("input").is(":checked")) {// (activeSwitch.hasClass("active")) {
                    temp = "yes"
                    htmlSwitchTemplate += `<span class="itemValue"><input type="checkbox" checked disabled /></span></div>`
                } else {
                    if (forcheck)
                        temp = "no"
                    else
                        temp = ""
                }
                if (temp) {
                    let optionElementSwitch = {
                        id: optionId,
                        value: temp,
                        html: htmlSwitchTemplate,
                    }
                    if (optionElementSwitch.value && optionElementSwitch.value.trim()) {
                        if (!$(option).parent().hasClass("tpo_hidden"))
                            options.push(optionElementSwitch)
                    }
                }
                break
            case 'dateRange':
                let optionValueDateRange = $(option).find(".tpo_option-input.tpo_text-box").val().split('[')[0].trim();
                let optionDateRangeLabel = $(option).find(".form-label.tpo_family-optionSetting").text()
                let htmlDateRangeTemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionDateRangeLabel}: </label><span class="itemValue">${optionValueDateRange}</span></div>`;
                let optionElementDateRange = {
                    id: optionId,
                    value: optionValueDateRange,
                    html: htmlDateRangeTemplate
                }
                if (optionElementDateRange.value && optionElementDateRange.value.trim()) {
                    if (!$(option).parent().hasClass("tpo_hidden"))
                        options.push(optionElementDateRange)
                }
                break
            case 'datePicker':
                let optionValueDatePicker = $(option).find(".tpo_option-input.tpo_text-box").val().split('[')[0].trim();
                let optionDatePickerLabel = $(option).find(".form-label.tpo_family-optionSetting").text()
                let htmlDatePickerTemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionDatePickerLabel}: </label><span class="itemValue">${optionValueDatePicker}</span></div>`;
                let optionElementDatePicker = {
                    id: optionId,
                    value: optionValueDatePicker,
                    html: htmlDatePickerTemplate
                }
                if (optionElementDatePicker.value && optionElementDatePicker.value.trim()) {
                    if (!$(option).parent().hasClass("tpo_hidden"))
                        options.push(optionElementDatePicker)
                }
                break
            case 'timePicker':
                let optionValueTimePicker = $(option).find(".tpo_option-input.tpo_text-box").val().split('[')[0].trim()
                let optionTimePickerLabel = $(option).find(".form-label.tpo_family-optionSetting").text()
                let htmlTimePickerTemplate = `<div class="itemOption clearfix"><label class="itemLabel">${optionTimePickerLabel}: </label><span class="itemValue">${optionValueTimePicker}</span></div>`;
                let optionElementTimePicker = {
                    id: optionId,
                    value: optionValueTimePicker,
                    html: htmlTimePickerTemplate
                }
                if (optionElementTimePicker.value && optionElementTimePicker.value.trim()) {
                    if (!$(option).parent().hasClass("tpo_hidden"))
                        options.push(optionElementTimePicker)
                }
                break
            case 'file-upload':
                let targetUploader;
                if (uploadArry != undefined && uploadArry.length > 0) {
                    for (var i = 0; i < uploadArry.length; i++) {
                        if (uploadArry[i].id == optionId)
                            targetUploader = uploadArry[i].target;
                    }
                }
                if (targetUploader != undefined && targetUploader.files != undefined && targetUploader.files.length > 0) {
                    let optionFileUploadLabel = $(option).find(".form-label.tpo_family-optionSetting").text()
                    let htmlFileUploadTemplate = `<div class="itemOption"><label class="itemLabel">${optionFileUploadLabel}: </label>`
                    let tempimg_src = [];
                    $(img_src).each(function (index, item) {
                        if (item.optionId == optionId) {
                            let res = item.file.split(",");
                            let src = res[0];
                            let fileName = res[1];
                            let imgType = "";
                            let fileNameExt = item.name.substr(item.name.lastIndexOf("."))
                            switch (fileNameExt) {
                                case '.jpeg':
                                case '.jpg':
                                case '.svg':
                                case '.png':
                                case '.tiff':
                                case '.tif':
                                    imgType = src;
                                    break;
                                case '.pdf':
                                    imgType = '/assets/images/fileTypeImage/pdfimg.png';
                                    break;
                                case '.doc':
                                case '.docx':
                                    imgType = '/assets/images/fileTypeImage/docimg.png';
                                    break;
                                case '.html':
                                case '.htm':
                                    imgType = '/assets/images/fileTypeImage/htmlimg.png';
                                    break;
                                case '.xls':
                                case '.xlsx':
                                    imgType = '/assets/images/fileTypeImage/xlsimg.png';
                                    break;
                                case '.txt':
                                    imgType = '/assets/images/fileTypeImage/txtimg.png';
                                    break;
                                default:
                                    imgType = '/assets/images/fileTypeImage/cusimg.png';
                                    break;
                            }

                            if (tempimg_src.indexOf(item.file) == -1) {
                                tempimg_src.push(item.file)
                                if (fileNameExt === '.jpeg' || fileNameExt === '.jpg' || fileNameExt === '.svg' || fileNameExt === '.png' || fileNameExt === '.tiff' || fileNameExt === '.tif') {
                                    htmlFileUploadTemplate += `<span class="itemValue"><a href="${imgType}" target="_blank"><img src="${imgType}" alt="${fileName}"/></a></span>`
                                } else {
                                    htmlFileUploadTemplate += `<span class="itemValue"><a href="${src}" title="${item.name}" target="_blank"><img src="${imgType}" alt="${fileName}"/></a></span>`
                                }
                            }
                        }
                    })
                    htmlFileUploadTemplate += "</div>"

                    let optionElementFileUploader = {
                        id: optionId,
                        value: tempimg_src.join(";"),
                        html: htmlFileUploadTemplate
                    }
                    if (optionElementFileUploader.value && optionElementFileUploader.value.trim()) {
                        if (!$(option).parent().hasClass("tpo_hidden"))
                            options.push(optionElementFileUploader)
                    }
                } else {
                    $(option).find(".file_price").removeClass("active")
                }
                break
        }
    })
    return options;
}

function getProductOptionUrl(optionsets) {
    let checkouturl = ""

    return checkouturl;
}

function successFile(obj, optionSets) {
    addtocart(obj, optionSets)
}

function addtocart(obj) {
    let formElement = document.querySelector("form#cart");
    let quantityInput = document.querySelector("#txt_num")
    var optionsets = getProductParams()

    var $obj = $(obj);
    var $btn = $obj.addClass("btn_ajax").button('loading');
    var sku = $("#sku_id").val();
    var prodcutid = $("#prodcutid").val();
    var num = $("#txt_num").val();

    if ($obj.data("checkout") || ($obj.data("url") && /\/checkout(new)?$/i.test($obj.data("url")))) {

        var checkouturl;
        try {
            checkouturl = chectoutpage;
        } catch (e) {
            checkouturl = $obj.data("url");
        }
        var url = checkouturl + "?productid=" + prodcutid + ((sku && sku != prodcutid) ? '&skuid=' + sku : '') + "&qty=" + num + ($('body').data('template') == "flashsaleproduct" ? "&at=fs" : "");
        var setSingleProductCheckOutOptionResult = true;
        if (!/\/checkout$/i.test(checkouturl)) {
            var _orderGuid = guid();
            url += "&orderGuid=" + _orderGuid;

            if (typeof appliedOptionSets != "undefined") {
                if (appliedOptionSets.length > 0) {
                    if (validateForm(formElement, quantityInput)) {
                        optionsets.options = JSON.stringify(optionsets.options)
                        //let checkoutUrl = getProductOptionUrl(optionsets)
                        $.ajax({
                            type: "POST",
                            url: "/Submit/ajaxrequest.ashx?cmd=SetSingleProductCheckOutOption",
                            async: false,
                            dataType: 'json',
                            data: { orderGuid: _orderGuid, options: optionsets.options },
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
                    } else
                        setSingleProductCheckOutOptionResult = false;
                }
            }
        }
        $btn.removeClass("btn_ajax").button('reset');
        if (setSingleProductCheckOutOptionResult)
            window.location.href = url;
        return;
    }

    if ((typeof validateForm != "function") || (typeof validateForm == "function" && validateForm(formElement, quantityInput))) {
        if (typeof validateForm == "function" && optionsets.options.length > 0) {
            optionsets.options = JSON.stringify(optionsets.options)
        } else {
            optionsets.options = ""
        }

        $.ajax({
            type: "POST",
            url: "/Submit/ajaxrequest.ashx?cmd=CartItemUpdate",
            data: optionsets,
            success: function (data, textStatus) {
                setCartValueExp();
                if (data == "True") {
                    CheckCartUpdateResult(prodcutid, sku, num, obj);
                } else {
                    alert("Failed to add cart");
                }
                $btn.removeClass("btn_ajax").button('reset');
                //alert("123")
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


function CheckCartUpdateResult(productid, sku, num, obj) {
    var $obj = $(obj);
    var $btn = $(obj);
    $.ajax({
        type: "POST",
        url: "/Submit/ajaxrequest.ashx?cmd=GetShopCartItemNumber",
        async: false,
        beforeSend: function (XMLHttpRequest) {
        },
        success: function (data, textStatus) {
            if (data == 0) {
                var date = new Date();
                date.setTime(date.getTime() + 60 * 60 * 24 * 1000 * 365 * 2);
                $.cookie("_ysv", _guidnew(), {
                    path: '/',
                    expires: date,
                    domain: getDomain()
                });
                $.ajax({
                    type: "POST",
                    url: "/Submit/ajaxrequest.ashx?cmd=CartItemUpdate&t=add&sku_id=" + escape(texttohtml(sku)).replace(/\+/g, '%2B').replace('%D7', '%c3%97') + "&productid=" + productid + "&num=" + num,
                    beforeSend: function (XMLHttpRequest) {

                    },
                    success: function (data, textStatus) {
                        setCartValueExp();
                        if (data == "True") {
                            //var cartvalue = JSON.parse($.cookie("cartvalue"));
                            if ($obj.attr("data-url")) {
                                $btn.button('reset');
                                window.location.href = $obj.attr("data-url");
                            } else {
                                ajax_lodding();
                                if ($obj.attr("data-modal")) {
                                    $($obj.attr("data-modal")).modal('show');
                                }
                                if ($obj.attr("data-model")) {
                                    $($obj.attr("data-model")).addClass("on").hover(function () {
                                        $(this).removeClass("on");
                                    });
                                }
                                if ($obj.attr("data-alert") == "") {
                                    alert("Add cart success");
                                }
                                if ($obj.attr("data-alert")) {
                                    alert($obj.attr("data-alert"));
                                }
                            }
                        } else {
                            alert("Failed to add cart");
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
                if ($obj.attr("data-url")) {
                    $btn.button('reset');
                    window.location.href = $obj.attr("data-url");
                } else {
                    ajax_lodding();
                    if ($obj.attr("data-modal")) {
                        $($obj.attr("data-modal")).modal('show');
                    }
                    if ($obj.attr("data-model")) {
                        $($obj.attr("data-model")).addClass("on").hover(function () {
                            $(this).removeClass("on");
                        });
                    }
                    if ($obj.attr("data-alert") == "") {
                        alert("Add cart success");
                    }
                    if ($obj.attr("data-alert")) {
                        alert($obj.attr("data-alert"));
                    }
                }
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
}

function _S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

function _guidnew() {
    return (_S4() + _S4() + _S4() + _S4() + _S4() + _S4() + _S4() + _S4());
}

function submit_form(obj) {
    return false;
}

$("#ul_skulist .goods_sku").click(function () {
    var $obj = $(this).closest("#ul_skulist"), picture = $(this).attr("data-picture");
    $('#cart .hide_button_add_wanquanyun,#cart .hide_button_buy_wanquanyun,#cart [onclick="addtocart(this)"]').attr("disabled", "disabled");
    if ($(this).closest(".dropdown").length > 0) {
        $(this).closest(".specification_tab").find(".tab_val").html($(this).text());
        $(this).addClass("select").siblings().removeClass("select");
        if ($(this).hasClass("sku_style")) {
            $(this).closest(".dropdown").find(".dropdown-val").addClass("sku_style");
        } else {
            $(this).closest(".dropdown").find(".dropdown-val").removeClass("sku_style");
        }
        $(this).closest(".dropdown").find(".dropdown-val").html($(this).find("a").html());
        if ($obj.find(".goods_sku.select").length == $obj.find("ul").length) {
            sku_key(goods_select(), picture);
        } else
            sku_picture(picture);
    } else {
        if ($(this).hasClass("select")) {
            $(this).closest(".specification_tab").find(".tab_val").html("");
            $(this).removeClass("select");
        } else {
            $(this).closest(".specification_tab").find(".tab_val").html($(this).text());
            $(this).addClass("select").siblings().removeClass("select");
            if ($obj.find(".goods_sku.select").length == $obj.find("ul").length) {
                sku_key(goods_select(), picture);
            } else
                sku_picture(picture);
        }
    }
    if (Shopify.products.length > 0) {
        if (Shopify.products[0].id == undefined) {
            if (Shopify.products[0][0].options.length == goods_select().length) {
                $('#smart-button-container_mask').hide()
            } else {
                $('#smart-button-container_mask').show();
            }
        }
        else {
            if (Shopify.products[0].variantgroups != null) {
                if (Shopify.products[0].variantgroups.length == goods_select().length&&$('[onclick="addtocart(this)"]').attr("disabled")==undefined) {
                    $('#smart-button-container_mask').hide()
                } else {
                    $('#smart-button-container_mask').show();
                }
            }
        }
    }
    $('#cart [onclick="AddToInquiryCart(this)"]').removeAttr("disabled", "disabled");
})

function sku_picture(picture) {
    if (picture != "" && picture != undefined) {
        get_preview_img();
        url = picture.replace(/\http:|\https:/g, "");
        var $obj = $("#slideBox_nav img[src*='" + url + "'],#slideBox_nav img[_src*='" + url + "'],.productshow_list .productshow_list .bd img[_src*='" + url + "'],.productshow_list .productshow_list .bd img[src*='" + url + "'],.preview_pic img[data-url*='" + url + "']");
        if ($obj.length > 0) {
            var imgs = $(".preview_pic img");
            var $uls = $(".preview_pic ul");
            var ul_length = $uls.length;
            picture = picture.substring(picture.indexOf("//"));
            for (var i = 0; i < imgs.length; i++) {
                var url = imgs.eq(i).data("url");
                if (url.indexOf("?") != -1) {
                    url = url.substring(url.indexOf("//")).split('?')[0];
                } else {
                    url = url.substring(url.indexOf("//"));
                }
                if (picture == url) {
                    for (var z = 0; z < ul_length; z++) {
                        $(".sNext_2").click()
                        $(".sNext").click()
                    }
                    $(".preview_pic li").removeClass("on");
                    imgs.eq(i).parents("li").addClass("on");
                    imgs.eq(i).parents("li").click();
                    for (var j = 0; j < ul_length; j++) {
                        if ($uls.eq(j).find("li").hasClass("on")) {
                            var width = $(".preview_pic>ul").eq(0).width();
                            $(".preview_pic").css("transform", "translate(" + (-(width * j)) + "px, 0px) translateZ(0px)")
                            break;
                        }
                    }
                    break;
                }
            }

            $obj.click();

        } else {
            var img = new Image();
            if (isLazyImg.length > 0) {
                $(img).attr("srcset", picture + ' 240w,' + picture + ' 360w,' + picture + ' 480w,' + picture + ' 720w,' + picture + ' 768w,' + picture + ' 960w,' +
                    picture + ' 1280w')
            } else {
                img.src = picture;
            }

            if (img.complete) {
                add_preview_img(picture);
                return false;
            }
            img.onload = function () {
                add_preview_img(picture);
            }
        }
    }
}


function add_preview_img(picture) {
    var index = $("#slideBox .pageState span,#slideBox .pageState_on span,.productshow_list .pagestate span").text();
    if (index) {
        var $img = $("#slideBox .products_img,.productshow_list .products_img").eq(parseInt(index) - 1).find("img");
        $img.parents().next().attr("href", picture)
        if (isLazyImg.length > 0) {
            var srcSet = $img.attr("data-srcset") || $img.attr("srcset");
            $img.addClass("add-preview-img");
            $img.attr("data-srcset", srcSet);
            $img.attr("srcset", picture + ' 240w,' + picture + ' 360w,' + picture + ' 480w,' + picture + ' 720w,' + picture + ' 768w,' + picture + ' 960w,' + picture + ' 1280w')
        } else {
            var src = $img.attr("_src") || $img.attr("src");
            $img.addClass("add-preview-img");
            $img.attr("_src", src);
            $img.attr("src", picture);
        }
    }
}

function get_preview_img() {
    $("#slideBox .add-preview-img,.productshow_list .add-preview-img").each(function (index, element) {
        $(this).removeClass("add-preview-img");
        var src = $(this).attr("data-srcset").split(" ")[0] || $(this).attr("_src");
        $(this).parents().next().attr("href", src.replace(/_w(\d+).jpg$/, ''));
        if ($(this).attr("_src") || $(this).attr("data-srcset")) {
            if ($(this).attr("_src")) {
                $(this).attr("src", $(this).attr("_src"));
            } else {
                $(this).attr("srcset", $(this).attr("data-srcset"));
            }
        }
    });
}

function goods_select() {
    var ul_sku_list = [];
    $("#ul_skulist ul .select").each(function (index, element) {
        ul_sku_list.push(texttohtml($(this).attr("attrid")));
    });
    return ul_sku_list;
}

function convertMoneyToNumber(moneyStr) {

    if (moneyStr === "" || moneyStr == undefined) return 0;

    let formatString = MONEY_FORMAT_TPO.trim();
    let placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    let thousands = ',';
    let decimal = '.';
    switch (formatString.match(placeholderRegex)[1]) {
        case 'amount_with_comma_separator':
        case 'amount_no_decimals_with_comma_separator':
            thousands = '.';
            decimal = ',';
            break;
        case 'amount_no_decimals_with_space_separator':
            thousands = ' ';
            break;
        case 'amount_with_apostrophe_separator':
            thousands = "'";
            break;
    }
    let numberRegex = /\d+((\.|\'| )\d+)*\,?\d*/g;
    let regexMatch = moneyStr.trim().match(numberRegex);
    if (regexMatch) {
        let tempPrice = regexMatch[0];
        tempPrice = tempPrice.replaceAll(thousands, '');
        tempPrice = tempPrice.replace(decimal, '.');
        tempPrice = tempPrice.replaceAll(' ', '');
        if (isNumeric(tempPrice)) {
            return parseFloat(tempPrice);
        }
    }

    return 0;
}


function sku_key(ul_sku_list, picture) {
    var get_sku_list = [];
    var price = 0, num = $("[name=txt_num]").val();
    let additionalPrice = convertMoneyToNumber($(".tpo_total-additional-price").attr("extra") == undefined ? "" : $(".tpo_total-additional-price").attr("extra"))
    if (sku_list) {
        $.each(sku_list, function (index, obj) {
            obj.sku_key = texttohtml(obj.sku_key);
            if (obj.variantids != null && obj.variantids.sort().toString() == ul_sku_list.sort().toString()) {
                get_sku_list.push(obj);
            }
        })
        if (get_sku_list.length == 1) {
            var skuoriginalprice = get_sku_list[0].originalprice;
            if (skuoriginalprice == null) {
                skuoriginalprice = Shopify.products[0].originalprice;
            }
            price = get_sku_list[0].price, price_obj = price, quantity = get_sku_list[0].inventoryquantity, pricerange_price = 0;
            

            if (!get_sku_list[0].available) {
                quantity = 0;
            } else {
                if (quantity <= 0) {
                    quantity = 0;
                }
                if (num > quantity) {
                    num = $("#txt_num").val(quantity);
                } else if (num == 0 && quantity > 0) {
                    num = $("#txt_num").val("1");
                }
            }
			if (Shopify.products[0].pricerange != null) {
                $.each(Shopify.products[0].pricerange, function (index, objs) {
                    if (objs.qty <= num) {
                        if (Shopify.products[0].rangediscounttype == 1)
                            price = price_obj * objs.discount;
                        else {
                            price = price_obj - objs.discount;
                            if (price < 0)
                                price = 0;
                        }
                    }
                })
            } else {
                price += additionalPrice
            }
            pricerange_price = (Shopify.currency[0].rate * price).toFixed(2);

            if (quantity > 0) {
                if (get_sku_list[0].available) {
                    //$("#cart .hide_button_add_wanquanyun,#cart .hide_button_buy_wanquanyun")
                    $('#cart .hide_button_add_wanquanyun,#cart .hide_button_buy_wanquanyun,#cart [onclick="addtocart(this)"]').removeAttr("disabled");
                    if ($('body').data('template') == "flashsaleproduct")
                        $('.notflashsale').hide();
                }
            }
            else {
                if ($('body').data('template') == "flashsaleproduct")
                    $('.notflashsale').show();
            }
        }
        $("#f_price").text(Shopify.currency[0].tags + pricerange_price);

        $(".total_price span").text(Shopify.currency[0].tags + (pricerange_price * $("[name=txt_num]").val()).toFixed(2));
        if (get_sku_list[0].flashsaleignorestock) {
            $("#sp_stock").text('+∞');
        }
        else
            $("#sp_stock").text(quantity);
        $("#txt_num").attr("max", quantity);
        $("#sku_id").val(get_sku_list[0].sku_id);
        if (get_sku_list[0].image.src && get_sku_list[0].image.src != "") {
            sku_picture(get_sku_list[0].image.src);
        } else {
            sku_picture(picture);
        }
        var originalprice = (Shopify.currency[0].rate * skuoriginalprice).toFixed(2);
        $(".regular_price").text(Shopify.currency[0].tags + originalprice);
        if (Number(originalprice) > Number(pricerange_price)) {
            var product_discount = originalprice - pricerange_price;
            product_discount = ((product_discount / originalprice) * 100).toFixed(0);
            if (Number(product_discount) > 0) {
                product_discount = product_discount + '%<span>' + convertLanguage("general_off", "off") + '</span>';
                $(".product_discount").html(product_discount).show();
            } else {
                $(".product_discount").hide();
            }
        } else {
            $(".product_discount").hide();
            $('.regular_price').hide();
        }
      price = get_sku_list[0].price;
    }
    else {
        price = Shopify.products[0].price;
    }
    if (Shopify.products[0].pricerange != null) {
        $(".tb_wholesale").each(function (index, element) {
            if ($(this).find("tbody tr").length > 0) {
                $(this).find("tbody tr").each(function (index, element) {
                    let new_price = _getRangePrice(index, price);
                    if (num >= Shopify.products[0].pricerange[index].qty) {
                        pricerange_price = new_price;
                    }
                    $(this).find("td:eq(1)").text(Shopify.currency[0].tags + new_price);
                });
            } else {
                $(this).find("div > div").each(function (index, element) {
                    let new_price = _getRangePrice(index, price);
                    if (num >= Shopify.products[0].pricerange[index].qty) {
                        pricerange_price = new_price;
                    }
                    $(this).find("span:eq(1)").text(Shopify.currency[0].tags + new_price);
                });
            }
        });
         function _getRangePrice(index, price) {
     if (Shopify.products[0].rangediscounttype == undefined || Shopify.products[0].rangediscounttype == 1) {
         let new_price = (Shopify.currency[0].rate * price * Shopify.products[0].pricerange[index].discount).toFixed(2);
         let new_additional_price = parseFloat((Shopify.currency[0].rate * price * Shopify.products[0].pricerange[index].discount).toFixed(2))
         new_additional_price += parseFloat((Shopify.products[0].pricerange[index].discount * additionalPrice * Shopify.currency[0].rate).toFixed(2));
         if (parseInt($('#txt_num').val()) >= Shopify.products[0].pricerange[index].qty) {
             $(".total_price span").text(Shopify.currency[0].tags + (new_additional_price*parseInt($('#txt_num').val())).toFixed(2));
         }
         return new_additional_price.toFixed(2);
     }
     else {
         let new_price = (Shopify.currency[0].rate * (price - Shopify.products[0].pricerange[index].discount));
         if (new_price <= 0)
             new_price = 0;
         new_price += additionalPrice;
         if (parseInt($('#txt_num').val()) >= Shopify.products[0].pricerange[index].qty) {
            $(".total_price span").text(Shopify.currency[0].tags + (new_price * parseInt($('#txt_num').val())).toFixed(2));
         }
         return new_price.toFixed(2);
     }
 }
    }
}


function texttohtml(text) {
    if (text == '' || text == undefined) {
        return null;
    } else {
        text = text.toString();
    }
    if (text.indexOf('&amp;') != -1 || text.indexOf('&quot;') != -1 || text.indexOf('&lt;') != -1 || text.indexOf('&gt;') != -1 || text.indexOf('&#39;') != -1) {
        return text;
    }
    return $('<div/>').text(text).html();
}

function htmltotext(html) {
    return $('<div/>').html(html).text();
}

function getCartValue() {
    $.ajax({
        type: "get",
        datatype: "json",
        url: "/Submit/ajaxrequest.ashx?cmd=getCartValue",
        beforeSend: function (XMLHttpRequest) {

        },
        success: function (data, textStatus) {
            return data;
        },
        complete: function (XMLHttpRequest, textStatus) {

        },
        error: function () {
            return null;
        }
    });
}

function sku_select_xml() {
    var href = window.location.href;
    var indexss = window.location.href.indexOf("=");
    var sku_ids = getUrlpara("variant");
    var sku_id_arr = [];
    if (sku_list != null) {
        if (indexss != -1) {
            $.each(sku_list, function (index, obj) {
                if (obj.sku_id == sku_ids) {
                    $.each(obj.options, function (index, obj) {
                        sku_id_arr.push(obj.id)
                    })
                }
            })
            $("#ul_skulist ul").each(function (index, element) {
                $(this).find("li").each(function (index1, element1) {
                    if (sku_id_arr[index] == $(element1).attr("attrid")) {
                        $(element1).click();
                    }
                })
            });
        } else {
            $("#ul_skulist ul").each(function (index, element) {
                $(this).find("li:first").click();
            });
        }
    }
    else{
    	QtyDiscount();
        sku_key();
    }
}
