/**
 * @author swallsky <xjz1688@163.com>
 * @version 0.9
 */
(function ($,plupload) {
    /**
     * 预览连接
     */
    var previewdata = require('./previewdata');
    /**
     * 裁剪参数处理
     */
    var cropParas = require('./crop');
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
        server_sign_url = '../php/config.php', //远程服务端签名url
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
            dataType : "json",
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
        	var obj = send_request();
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
    $.fn.swalupload = function (options) {
        //默认值
        var defaults = {
            flash:'lib/plupload-2.1.2/js/Moxie.swf', //flash的路径
            silverlight:'lib/plupload-2.1.2/js/Moxie.xap', // silverlight的路径
            serverSignUrl:'', //远程服务器签名路径
            rename:true, //是否重新生成随机文件名,默认为true
            maxfilesize:'10mb', //充许上传的最大文件
            postButton:null, //提交按钮
            multi:false, //是否充许重复
            /**
             * 当文件添加到上传队列后触发监听函数
             * @param file 文件
             * @param selector 选择文件元素
             * @param up up对象
             * @constructor
             */
            FilesAdded:function (file,selector,up) {
                //todo
            },
            /**
             * 会在文件上传过程中不断触发，可以用此事件来显示上传进度监听函数
             * @param file 文件
             * @param selector 选择文件元素
             * @param up up对象
             * @constructor
             */
            UploadProgress:function (file,selector,up) {
                //todo
            },
            /**
             * 当队列中的某一个文件上传完成后触发监听函数
             * @param file 文件
             * @param info 服务器信息
             * @param selector 选择文件元素
             * @param up up对象
             * @constructor
             */
            FileUploaded:function (file,info,selector,up) {
                //todo
            },
            /**
             * 当上传队列中所有文件都上传完成后触发监听函数
             * @param file
             * @param selector
             * @param up
             * @constructor
             */
            UploadComplete:function (file,selector,up) {
                //todo
            },
            /**
             * 当发生错误时触发监听函数
             * @param msg 错误信息
             * @param selector 选择文件元素
             * @param up up对象
             * @constructor
             */
            Error:function (msg,selector,up) { //
                alert(msg);
            }
        };
        var me = this, //warp对象
        	opts = jQuery.extend(defaults,options);//options中如果存在defaults中的值，则覆盖defaults中的值
        if(opts.serverSignUrl!=''){
            server_sign_url = opts.serverSignUrl; //获取签名地址
        }
        //上传文件过滤规则
        opts = require('./filters')(opts);

        //批处理多个文件上传按钮
        $(this).each(function (i,o) {
            var uploader = new plupload.Uploader({
                runtimes: 'html5,flash,silverlight,html4', //运行环境
                multi_selection: typeof opts.multi, //是否可以同时上传多个文件,默认为单文件上传
                browse_button:$(o)[0], //上传按钮
                container: $(me).parent()[0], //上传容器
                url: 'http://oss.aliyuncs.com', //提交的url,
                flash_swf_url: opts.flash, //flash的路径
                silverlight_xap_url: opts.silverlight,//silver的路径
                filters: opts.filters, //文件过滤规则
                init: {
                    PostInit: function() {
                        if(opts.postButton != null){
                            $(opts.postButton).click(function () {
                                set_upload_param(uploader, '', false);
                                return false;
                            });
                        }else{
                        	set_upload_param(uploader, '', false);
                        }
                    },

                    FilesAdded: function(up, files) {
                    	//循环新增文件
                        plupload.each(files, function(file) {
                            file.ext = get_suffix(file.name).substring(1);//文件后缀名
                            file.ratio = plupload.formatSize(file.size); //转换后的大小显示
                            //得到预览图片信息
                            if($.inArray(file.ext.toLowerCase(),['jpg','png','gif']) == -1){//非图片
                                file.previewdata = ''; //图片预览地址
                                opts.FilesAdded(file,o,up);
                            }else{//图片预览数据
                                previewdata(file,function (imgsrc) {
                                    file.previewdata = imgsrc;
                                    opts.FilesAdded(file,o,up);
                                });
                            }
                        });
                        //当没有上传按钮时 自动上传文件
                        if(opts.postButton == null){
                        	set_upload_param(uploader, '', false);
                        }
                    },

                    BeforeUpload: function(up, file) {
                        check_object_radio(opts.rename);
                        set_upload_param(up, file.name, true);
                    },

                    UploadProgress: function(up, file) {
                        opts.UploadProgress(file,o,up); //百分比显示
                    },

                    FileUploaded: function(up, file, info) {
                        file.ext = get_suffix(file.name).substring(1);//文件后缀名
                        file.path = get_uploaded_object_name(file.name)+cropParas.get(); //上传后的文件路径
                        opts.FileUploaded(file,info,o,up);
                        cropParas.clear(); //图片裁剪参数
                    },

                    /**
                     * 当上传队列中所有文件都上传完成后触发监听函数
                     * @param up
                     * @param file
                     * @constructor
                     */
                    UploadComplete:function (up,file) {
                        if(file.length>0){//上传文件数必须大于0
                            opts.UploadComplete(file,o,up);
                            cropParas.clear(); //图片裁剪参数
                        }
                    },

                    Error: function(up, err) {
                        if (err.code == -600) {
                            opts.Error("选择的文件超过了"+opts.filters.max_file_size,o,up);
                        }
                        else if (err.code == -601) {
                            opts.Error("不能上传该类型的文件",o,up);
                        }
                        else if (err.code == -602) {
                            opts.Error("该文件已经上传过了",o,up);
                        }
                        else
                        {
                            opts.Error(err.response,o,up);
                        }
                    }
                }
            });
            uploader.init();
        });
        /**
         * 公共函数
         */
        return {
            /**
             * 设置裁剪参数
             * @param data
             * width: 指定裁剪宽度
             * height: 指定裁剪高度
             * x: 指定裁剪起点横坐标（默认左上角为原点）
             * y: 指定裁剪起点纵坐标（默认左上角为原点）
             */
            setCrop:function (data) {
                cropParas.set(data);
            },
            /**
             * 获取参数参数
             * @returns {string}
             */
            getCrop:function () {
                return cropParas.get();
            },
            /**
             * 清空裁剪参数
             */
            clearCrop:function () {
                cropParas.clear();
            }
        }
    };

})(jQuery,plupload);