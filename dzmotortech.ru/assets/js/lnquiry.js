var prefixes = "";
var count = 1;
var nextmarker = "";
var interval;
var number = 1;
var fileTypeArray;
var beforeflag = false;
var touchtime = new Date().getTime();
var is_search = false;
$(".add").click(function () {
    var num = $(this).siblings(".input_price").val()
    $(this).siblings(".input_price").val(++num)
    if(num == ""){
        $(this).siblings(".input_price").val("1")
    } 
    inqcount_Statistics();
})
function inqcount_Statistics(){
    var isnowinquiry = $(".inquiry_isnowinquiry").val();
    if(isnowinquiry =="false")
    {
        var  nums=0;
        for(var i = 0;i<$(".purchase_quantity").length;i++){
            var num=parseInt($(".purchase_quantity").eq(i).val());
            nums +=   num;
        }
        $(".inqcount1").text(nums)
    }
}
$(".minus").click(function () {
    var num = $(this).siblings(".input_price").val()
    if(num >0){
        $(this).siblings(".input_price").val(--num)
    }
    if(num == ""){
        $(this).siblings(".input_price").val("1")
    }
    inqcount_Statistics();
})
$('input[type="number"]').change(function () {
    var num = $(this).val();
    if(num<1){
        $(this).val(1);
    }
    inqcount_Statistics()
})
$(function () {
       
     
    if ($(".dropzone1 form").length > 0) {
        $(".dropzone1 form").each(function (index, element) {
            init_dropzone($(element))
        })
    }
    $(".deleteInquiryItems").click(function () {
        DeleteInquiryItems();
    });

    $(".submit_btn span").click(function () {
        //上传附件
        $(".dropzone1").each(function (index, element) {
            $(element).find(".updatefilebtn").click();
        })
        //获取询盘表单数据
        var nowInquiryData = GetNowInquiryData();
        if (nowInquiryData.result) {
            submitInquiryInfo(nowInquiryData);
        }
        else {
            $("#model_alert").find(".mod_code").text(nowInquiryData.verifyAllMsg[0]);
            $("#model_alert").modal("show");
        }
    })
})
$(".delete_this span").click(function () {
    var deleteInquiryItem = $(this).parents(".InquiryItem");
    var skuid = $(this).parents(".InquiryItem").data("skuid");
    var productid = $(this).parents(".InquiryItem").data("productid");
    var optionsskuid = $(this).parents(".InquiryItem").data("optionsskuid") == undefined ? "" : $(this).parents(".InquiryItem").data("optionsskuid");
    $.post("/Submit/AjaxInquiryRequest.ashx?cmd=InquiryCartRemoveItem", {
        sku_id: skuid, productid: productid, optionsskuid: optionsskuid
    }, function (data) {
        data = $.parseJSON(data);
        if (data.success == true) {

            //$("#model_alert").find(".mod_code").text("{{language.inquiry_deletion_succeeded}}");
            //$("#model_alert").modal("show");
            deleteInquiryItem.remove();
            var InquiryCarItemsCount = $(".InquiryItem").length;
            inqcount_Statistics()

            if (InquiryCarItemsCount < 1) {
                $(".no_inquiry_list").removeClass("hide");
            }

        }
    })
})



//获取询盘数据
function GetNowInquiryData() {
    var result = true;
    var verifyAllMsg = [];
    var verifyMsg = ""
    var InquiryRecord = {};

    var ListInquiryItems = [];
    if ($(".InquiryItem").length > 0) {
        $(".InquiryItem").each(function (index, element) {
            var InquiryItems = {}
            InquiryItems.productid = $(element).data("productid");
            InquiryItems.productname = $(element).data("productname");
            InquiryItems.SkuId = $(element).data("skuid");
            InquiryItems.Variant = $(element).data("variant");
            InquiryItems.attribute = $(element).data("attribute");
            InquiryItems.picture = $(element).data("picurl");
            InquiryItems.price = $(element).data("price");
            InquiryItems.number = $(element).find(".purchase_quantity").val();
            InquiryItems.purchaseamount = $(element).find(".purchase_amount").val();
            InquiryItems.message = $(element).find(".InquiryItems_message").val();
            InquiryItems.files = $(element).find(".filesurl").val()
            if ($(element).find(".customeitems .customeitem").length > 0) {
                InquiryItems.customeitems = [];
                $(element).find(".customeitems .customeitem").each(function (index, element) {
                    var item = {}
                    item.name = $(element).data("name")
                    if ($(element).data("required")) {
                        if ($(element).val() == "") {
                            verifyMsg = $(element).data("name") + "：" + convertLanguage("inquiry_cannot_empty","cannot be empty");
                            verifyAllMsg.push(verifyMsg);
                            //console.log(verifyMsg);
                            result = false;
                        }
                    }
                    if ($(element).data("isdefaultitem")) {
                        var columnName = $(element).data("name").replace("required", "");
                        InquiryRecord[columnName] = $(element).val();
                    }
                    else {
                        item.value = $(element).val();
                        item.filed = $(element).data("filed");
                        InquiryItems.customeitems.push(item);
                    }
                });
                if (InquiryItems.customeitems == []) {
                    InquiryItems.customeitems = null
                } else {
                    InquiryItems.customeitems = JSON.stringify(InquiryItems.customeitems)
                }
            }
          
          	 if ($(element).data("optionsskuid") != undefined && $(element).data("optionsskuid") != "") {
                var option = _curoptions.filter((option) => {
                    return option.id === $(element).data("optionsskuid");
                })
                if (option.length != 0) {
                    InquiryItems.options = option[0].values;
                }
            }
          
          
          
            ListInquiryItems.push(InquiryItems);
        })
    }
    else {

        verifyMsg = convertLanguage("inquiry_least_one_product");
        verifyAllMsg.push(verifyMsg);
        //console.log(verifyMsg);
        result = false;
    }

    InquiryRecord.custominquiryitem = [];
    $(".relationitems .relationitem").each(function (index, element) {
        var item = {}
        item.name = $(element).data("name")
        if ($(element).data("required")) {
            if ($(element).val() == "" || ($(element).data("filed") == "countryrequired" && $(element).val() == "0")) {
                var itemname=$(element).data("name");
                if($(element).parents('.Information').length!=0&&$(element).parents('.Information').find('label span').length!=0){
                    var tempname= $($(element).parents('.Information').find('label span')[0]).text();
                    if(tempname!=''&&tempname!=undefined){
                        itemname=tempname;
                    }
                }
                verifyMsg = itemname + "：" + convertLanguage("inquiry_cannot_empty","cannot be empty");
                verifyAllMsg.push(verifyMsg);
                //console.log(verifyMsg);
                result = false;
            }
        }
        if ($(element).data("isdefaultitem")) {
            var columnName = $(element).data("name").replace("required", "");
            InquiryRecord[columnName] = $(element).val();
        }
        else {
            item.value = $(element).val();
            item.filed = $(element).data("filed");
            InquiryRecord.custominquiryitem.push(item);
        }
    });
    if (InquiryRecord.custominquiryitem == []) {
        InquiryRecord.custominquiryitem = null
    } else {
        InquiryRecord.custominquiryitem = JSON.stringify(InquiryRecord.custominquiryitem)
    }

    var InquiryReply = null;
    if (result) {
        return { result: result, InquiryRecord: InquiryRecord, ListInquiryItems: ListInquiryItems, InquiryReply: InquiryReply };
    }
    else {
        return { result: result, verifyAllMsg: verifyAllMsg }
    }
}


function init_dropzone(obj) {
    var enclosureTotalSize = $(obj).siblings("P").find(".enclosureTotalSize");
    var filelist = []
    $.ajaxSettings.async = false;
    Dropzone.autoDiscover = false;
    $(obj).dropzone({
        url: "https://usaimages.oss-us-west-1.aliyuncs.com",
        maxFiles: 3,
        maxFilesize: 10,
        parallelUploads: 3,
        addRemoveLinks: true,
        acceptedFiles: ".jpeg,.ppt,.pptx,.doc,.docx,.pdf,.txt,.jpg,.gif,.png,.xls,.xlsx",
        autoProcessQueue: false,
        dictFileTooBig: convertLanguage("inquiry_upload_file_maximum"),
        paramName: "file",
        init: function () {
            var myDropzone = this, submitButton = document.querySelector("#qr");

            //cancelButton = document.querySelector("#cancel");

            var num = 0;
            myDropzone.on('addedfile', function (files) {
                this.element.lastElementChild.setAttribute("data-size", files.size);

                if ($(obj).find(".dz-preview").length > 2) {
                    $(obj).find(".jia").attr("style","display:none!important");
                }
                var count = 0;
                for (var i = 0; i < $(obj).find(".dz-preview").length; i++) {
                    var num = $(obj).find(".dz-preview").eq(i).data("size");
                    count += num;
                }
                var html = '';


                if ($(obj).find(".dz-preview").length > myDropzone.options.maxFiles) {
                    $("#model_alert").find(".mod_code").text(convertLanguage("inquiry_upload_files"));
                    $("#model_alert").modal("show");
                    this.removeFile(files)

                } else if (count > 10485760) {
                    $("#model_alert").find(".mod_code").text(convertLanguage("inquiry_upload_file_maximum"));
                    $("#model_alert").modal("show");
                    this.removeFile(files)


                } else {
                    if (count < 1024) {
                        html += '<strong>' + count + '</strong> B'
                        $(enclosureTotalSize).html(html);
                    } else if (count >= 1024 && count < 1048576) {

                        html += '<strong>' + Math.floor(count / 1024 * 10) / 10 + '</strong> KB'
                        $(enclosureTotalSize).html(html);
                    } else {
                        html += '<strong>' + Math.floor(count / 1024 / 1024 * 10) / 10 + '</strong> MB'
                        $(enclosureTotalSize).html(html);
                    }
                }
            });
            myDropzone.on('sending', function (data, xhr, formData) {
                //向后台发送该文件的参数
                var signJson = requestSign(data.name);
                for (var item in signJson) {
                    formData.append(item, signJson[item]);
                }
                var filesurlVal = $(obj).find(".filesurl").val();
                var url = "http://images.51microshop.com/"
                if (filesurlVal == "") {
                    $(obj).find(".filesurl").val(url + signJson.key)
                }
                else {
                    $(obj).find(".filesurl").val(filesurlVal + "卍" + url + signJson.key)
                }
            });
            myDropzone.on('success', function (files, response) {

            });
            myDropzone.on('error', function (files, response) {
                //文件上传失败后的操作
            });
            myDropzone.on('removedfile', function (files, response) {
                if ($(obj).find(".dz-preview").length < 3) {
                    $(obj).find(".jia").attr("style","display:inline-block!important");
                }
                var count = 0;
                for (var i = 0; i < $(obj).find(".dz-preview").length; i++) {
                    var num = $(obj).find(".dz-preview").eq(i).data("size");
                    count += num;
                }
                var html = '';
                if (count < 1024) {
                    html += '<strong>' + count + '</strong> B'
                    $(enclosureTotalSize).html(html);
                } else if (count >= 1024 || count < 1048576) {

                    html += '<strong>' + Math.ceil(count / 1000 * 10) / 10 + '</strong> KB'
                    $(enclosureTotalSize).html(html);
                } else {
                    html += '<strong>' + Math.ceil(count / 1000 / 1024 * 10) / 10 + '</strong> MB'
                    $(enclosureTotalSize).html(html);
                }
            });
            myDropzone.on('totaluploadprogress', function (progress, byte, bytes) {
                //progress为进度百分比
                //$("#pro").text("上传进度：" + parseInt(progress) + "%");

            });
            submitButton.addEventListener('click', function () {
                //点击上传文件
                myDropzone.processQueue();
            });
            //cancelButton.addEventListener('click', function () {
            //    //取消上传
            //    myDropzone.removeAllFiles();
            //});
        }
    });
    function requestSign(filename) {
        var multipart_params = {};
        $.ajax({
            async: false,
            dataType: "json",
            url: "/Submit/AjaxInquiryRequest.ashx?cmd=GenSignature",
            data: { action: "signature", rnd: Math.random() },
            success: function (data) {
                var timestamp = new Date().getTime()
                multipart_params.policy = data["policy"];
                multipart_params.OSSAccessKeyId = data["accessid"];
                multipart_params.signature = data["signature"];
                multipart_params.name = filename;
                multipart_params.key = data["userid"] + "/" + "InquiryFile/" + timestamp + "_" + filename;

            },
            error: function (data) {
                $("#model_alert").find(".mod_code").text(convertLanguage("inquiry_failed_request_signature"));
                $("#model_alert").modal("show");
            }
        });

        return multipart_params;
    }
    $.ajaxSettings.async = true;
}












