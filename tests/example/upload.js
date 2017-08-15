(function ($) {
    /**
     * 基础配置参数
     * @type {string}
     */
    var accessid = '',
        host = '',
        policyBase64 = '',
        signature = '',
        callbackbody = '',
        filename = '',
        key = '',
        expire = 0,//有效期参数
        g_object_name = '',
        g_object_name_type = '',
        server_sign_url = '../../php/get.php', //远程服务端签名url
        now = timestamp = Date.parse(new Date()) / 1000;
    /**
     * 远程读取policy
     * @returns {String|null|string}
     */
    function send_request()
    {
        var result = {};
        $.ajax({
            type : "GET",
            url : server_sign_url,
            async : false, //同步读取配置信息
            success : function(data){
                result = data;
            }
        });
        return result;
    };
    /**
     * 是否使用本地文件名 默认随机文件名
     * @param t
     */
    function check_object_radio(t) {
        g_object_name_type = (t == true?
            'random_name': //随机文件名
            'local_name' //本地文件名
        );
    };

    /**
     * 获取签名
     * @returns {boolean}
     */
    function get_signature()
    {
        //可以判断当前expire是否超过了当前时间,如果超过了当前时间,就重新取一下.3s 做为缓冲
        now = timestamp = Date.parse(new Date()) / 1000;
        if (expire < now + 3)
        {
            body = send_request();
            var obj = $.parseJSON(body);
            host = obj['host'];
            policyBase64 = obj['policy'];
            accessid = obj['accessid'];
            signature = obj['signature'];
            expire = parseInt(obj['expire']);
            callbackbody = obj['callback'];
            key = obj['dir'];
            return true;
        }
        return false;
    };
    /**
     * 生成随机文件名
     * @param len
     * @returns {string}
     */
    function random_string(len)
    {
        len = len || 32;
        var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
        var maxPos = chars.length;
        var pwd = '';
        for (i = 0; i < len; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    };
    /**
     * 获取文件后缀名
     * @param filename
     * @returns {string}
     */
    function get_suffix(filename) {
        pos = filename.lastIndexOf('.')
        suffix = ''
        if (pos != -1) {
            suffix = filename.substring(pos)
        }
        return suffix;
    };

    /**
     * 计算对象名
     * @param filename
     * @returns {string}
     */
    function calculate_object_name(filename)
    {
        if (g_object_name_type == 'local_name')
        {
            g_object_name += "${filename}";
        }
        else if (g_object_name_type == 'random_name')
        {
            suffix = get_suffix(filename);
            g_object_name = key + random_string(10) + suffix;
        }
        return '';
    };
    /**
     * 获取上传后的对象名
     * @param filename
     * @returns {*}
     */
    function get_uploaded_object_name(filename)
    {
        if (g_object_name_type == 'local_name')
        {
            tmp_name = g_object_name;
            tmp_name = tmp_name.replace("${filename}", filename);
            return tmp_name;
        }
        else if(g_object_name_type == 'random_name')
        {
            return g_object_name;
        }
    };
    /**
     * 设置上传参数
     * @param up
     * @param filename
     * @param ret
     */
    function set_upload_param(up, filename, ret)
    {
        if (ret == false)
        {
            ret = get_signature();
        }
        g_object_name = key;
        if (filename != '') {
            suffix = get_suffix(filename);
            calculate_object_name(filename);
        }
        new_multipart_params = {
            'key' : g_object_name,
            'policy': policyBase64,
            'OSSAccessKeyId': accessid,
            'success_action_status' : '200', //让服务端返回200,不然，默认会返回204
            'callback' : callbackbody,
            'signature': signature,
        };

        up.setOption({
            'url': host,
            'multipart_params': new_multipart_params
        });

        up.start();
    };

    /**
     * jquery扩展
     * @param options
     */
    $.fn.alioss = function (options) {
        //默认值
        var defaults = {
            flash:'lib/plupload-2.1.2/js/Moxie.swf', //flash的路径
            silverlight:'lib/plupload-2.1.2/js/Moxie.xap', // silverlight的路径
            serverSignUrl:'', //远程服务器签名路径
            rename:true, //是否重新生成随机文件名,默认为true
            maxfilesize:'10mb', //充许上传的最大文件
            postButton:null, //提交按钮
            multi:false, //是否充许重复
            browse:$(this)[0], //上传按钮
            container:$(this).parent()[0], //上传的容器
            FilesAdded:function (file) {//添加文件
                //todo
            },
            UploadProgress:function (file) {//进度显示
                //todo
            },
            FileUploaded:function (file,info) { //文件上传完成后显示
                //todo
            },
            Error:function (msg) { //上传错误显示
                alert(msg);
            }
        };
        var opts = jQuery.extend(defaults,options);//options中如果存在defaults中的值，则覆盖defaults中的值
        if(opts.serverSignUrl!=''){
            server_sign_url = opts.serverSignUrl; //获取签名地址
        }
        //批处理多个文件上传按钮
        $(this).each(function (i,o) {
            var uploader = new plupload.Uploader({
                runtimes: 'html5,flash,silverlight,html4', //运行环境
                multi_selection: opts.multi, //是否可以同时上传多个文件,默认为单文件上传
                browse_button: opts.browse, // $('#selectfiles')[0],
                container: opts.container, //$('#container')[0],
                url: 'http://oss.aliyuncs.com', //提交的url,
                flash_swf_url: opts.flash, //flash的路径
                silverlight_xap_url: opts.silverlight,//silver的路径
                filters: { //充许上传的文件
                    mime_types : [ //只允许上传图片和zip,rar文件
                        { title : "Image files", extensions : "jpg,gif,png,bmp" },
                        { title : "Zip files", extensions : "zip,rar" }
                    ],
                    max_file_size : opts.maxfilesize, //最大只能上传10mb的文件
                    prevent_duplicates : true //不允许选取重复文件
                },
                init: {
                    PostInit: function() {
                        if(opts.postButton != null){
                            $(opts.postButton).click(function () {
                                set_upload_param(uploader, '', false);
                                return false;
                            });
                        }else{
                            //todo
                        }
                    },

                    FilesAdded: function(up, files) {
                        plupload.each(files, function(file) {//循环新增文件
                            file.ratio = plupload.formatSize(file.size); //转换后的大小显示
                            opts.FilesAdded(file);
                        });
                    },

                    BeforeUpload: function(up, file) {
                        check_object_radio(opts.rename);
                        set_upload_param(up, file.name, true);
                    },

                    UploadProgress: function(up, file) {
                        opts.UploadProgress(file); //百分比显示
                    },

                    FileUploaded: function(up, file, info) {
                        file.name = get_uploaded_object_name(file.name); //上传后的文件名
                        opts.FileUploaded(file,info);
                    },

                    Error: function(up, err) {
                        if (err.code == -600) {
                            opts.Error("选择的文件超过了"+opts.maxfilesize);
                        }
                        else if (err.code == -601) {
                            opts.Error("不能上传该类型的文件");
                        }
                        else if (err.code == -602) {
                            opts.Error("该文件已经上传过了");
                        }
                        else
                        {
                            opts.Error(err.response);
                        }
                    }
                }
            });
            uploader.init();
        });
    };

})(jQuery);