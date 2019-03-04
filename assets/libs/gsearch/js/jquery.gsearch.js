/*!
 * jquery.gsearch.js 0.9.0
 * https://github.com/itobee/ghost-search
 *
 * Licensed under the MIT license.
 * https://github.com/itobee/gsearch/blob/gh-pages/LICENSE
 *
 * Copyright (c) 2016, Tobee
 * http://tobee.me
 */

;(function ($) {

    'use strict';

    $.fn.extend({

        "gsearch": function (opts) {

            var defaults = {
                    // 默认配置
                    show: 10,  // 每页显示条数
                    rss: '/rss',  // RSS地址
                    excerpt: 120,  // 摘要字符长度
                    trigger: 'keyup',  // String，搜索触发方式，可选值：keyup,enter
                },

                // 合并配置选项
                options = $.extend(true, {}, defaults, opts, this.data()),

                that = this,

                // 初始化
                init = function () {
                    that.allPosts = [];
                    that.fiterPosts = [];
                    that.tmpl = $('template', that).html();

                    methods.data(function () {
                        $('template', that).replaceWith(render());
                    });

                },

                // 插件方法
                methods = {

                    // 获取文章数据
                    data: function (callback) {

                        // 加载RSS文件
                        $.ajax({
                            url: options.rss,
                            success: function (rss, status) {
                                var $rss = $(rss), posts = [];

                                if (status === 'success') {
                                    $.each($('item', $rss), function (i) {
                                        var $this = $(this),

                                            // 构造当前文章对象
                                            post = {
                                                title: $('title', $this).text(),  // 标题
                                                link: $('link', $this).text(),  // 文章链接
                                                content: $('encoded', $this).text().replace(/<[^>]*>|[ ]|[\r\n]/ig,''),  // 文章内容
                                                excerpt: $('description', $this).text().replace(/<[^>]*>|[ ]|[\r\n]/g,''),  //描述
                                                author: $('creator', $this).text(),  // 作者
                                                category: $('category', $this).text(),  // 分类
                                                date: new Date($('pubDate', $this).text()).toLocaleDateString()  // 发布日期
                                            };

                                        // 将当前文章信息添加到所有文章中
                                        posts.push(post);
                                    });

                                    // 保存文章数据
                                    that.allPosts = posts;
                                    callback();

                                } else {
                                    methods.errors('粗错啦~~，错误类型：' + status);
                                }

                            },
                            error: function () {
                                methods.errors('加载文章出错，请重试! ~_~');
                            }
                        });
                    },

                    // 通过关键字查找
                    filter: function (keywords, callback) {
                        that.fiterPosts = [];

                        // 遍历所有文章
                        $.grep(that.allPosts, function (post) {
                            var next = true;

                            $.each(post, function () {
                                if (next && this.match(keywords) !== null) {

                                    // 截取描述字符串
                                    post.excerpt = post.excerpt.slice(0,options.excerpt);

                                    // 添加符合条件的文章
                                    that.fiterPosts.push(post);

                                    next = false;
                                    return false;
                                }
                            });
                        });

                        callback();
                    },

                    // 返回搜索结果
                    result: function (keywords, page) {

                        var data = that.fiterPosts,
                            html = '';

                        // 有符合条件的文章
                        if (data.length > 0) {
                            var posts = data.slice((page - 1) * options.show, page * options.show), // 获取当前页文章数据
                                result = this.tmpl('result');

                            // 遍历所有文章数组，获取单篇文章信息
                            $.each(posts, function (i, post) {
                                var tpl = result;

                                // 遍历单篇文章对象
                                $.each(post, function (key, value) {

                                    // 关键词高亮显示
                                    if (key !== 'link') {
                                        var reg = new RegExp(keywords, 'g');
                                        value = value.replace(reg, '<em>' + keywords + '</em>');
                                    }

                                    // 替换模板变量
                                    tpl = tpl.replace('{' + key + '}', value);
                                });

                                // 追加文章信息
                                html += tpl;
                            });
                        } else {
                            html = this.infos('没有找到相关文章...');
                        }


                        return html;
                    },

                    // 返回相关信息
                    query: function (keywords) {
                        var posts = that.fiterPosts,
                            tpl = this.tmpl('query'),
                            html = tpl.replace('{keyword}', keywords).replace('{amount}', posts.length); // 替换模板变量

                        return html;
                    },

                    // 返回分页信息
                    pages: function (current) {
                        var posts = that.fiterPosts,
                            pageTotal = Math.ceil(posts.length / options.show),
                            num = 1,
                            max = 5,
                            html = '';

                        if (current > 2 && current <= pageTotal - 2) {
                            num = current - 2;
                            max = current + 2;
                        } else if (current > pageTotal - 2) {
                            num = pageTotal - 4;
                            max = pageTotal;
                        }

                        for (var i = num; i <= max && i <= pageTotal; i++) {
                            var pages = this.tmpl('pages');

                            if (i > 0) {

                                // 选中分页
                                if (current !== i) {
                                    pages = pages.replace(' active', '');
                                }

                                // 替换页码
                                html += pages.replace(/\{page}/g, i);
                            }
                        }

                        return html;

                    },

                    // 返回模板数据
                    tmpl: function (tag) {
                        var tpl = that.tmpl,
                            reg = new RegExp('{' + tag + '}([\\s\\S]*?){\\/' + tag + '}', 'g');

                        tpl = String(tpl.match(reg)).replace('{' + tag + '}', '').replace('{/' + tag + '}', '');

                        return tpl;
                    },

                    // 信息提示
                    infos: function (info) {
                        return this.tmpl('infos').replace('{info}', info);
                    },

                    // 错误提示
                    errors: function (error) {
                        var html = methods.tmpl('body').replace(new RegExp('{result}([\\s\\S]*?){\\/infos}'), methods.infos(error));
                        $('template', that).replaceWith(html);
                    }
                },

                // 渲染模板
                render = function (keywords, page) {//返回html内容

                    var body = methods.tmpl('body'),
                        footer = '',
                        html = '';

                    // 判断是否是初次加载界面
                    if (!keywords) {
                        html = body.replace(new RegExp('{result}([\\s\\S]*?){\\/infos}'), methods.infos('啦啦啦，啦啦啦，我是卖报的小行家~'));
                    } else {
                        methods.filter(keywords, function () {
                            var footer = methods.tmpl('footer'),
                                posts = that.fiterPosts,
                                prev = (page > 1 && posts.length > 0) ? methods.tmpl('prev').replace('{page}', page - 1) : '',
                                next = (page < (posts.length / options.show)) ? methods.tmpl('next').replace('{page}', page + 1) : '';

                            body = body.replace(new RegExp('{result}([\\s\\S]*?){\\/infos}'), methods.result(keywords, page));
                            footer = footer.replace(new RegExp('{query}([\\s\\S]*?){\\/query}'), methods.query(keywords))
                                .replace(new RegExp('{pages}([\\s\\S]*?){\\/pages}'), methods.pages(page))
                                .replace(new RegExp('{prev}([\\s\\S]*?){\\/prev}'), prev)
                                .replace(new RegExp('{next}([\\s\\S]*?){\\/next}'), next);

                            html = body + footer;
                        });
                    }

                    return html;
                };

            init();

            $.each(this, function () {

                var $searchField = $('[data-content="keywords"]', this),
                    $searchClear = $('[data-content="clear"]', this),
                    $searchContent = $('[data-content="content"]', this);

                // 搜索框相关
                $searchField.on({
                    'keyup': function (e) {
                        var keywords = $(this).val(),
                            keycode = (e.keyCode ? e.keyCode : e.which);

                        if (options.trigger === 'keyup' || (options.trigger === 'enter' && keycode === 13)) {
                            if (keywords !== '') {
                                $searchClear.fadeIn();
                                if ($.trim(keywords)) {
                                    $searchContent.html(render(keywords, 1));
                                }
                            } else {
                                $searchClear.fadeOut();
                                $searchContent.html(render());
                            }
                        }
                    },
                    'focus': function () {
                        $(this).parent().addClass('focus');
                    },
                    'blur': function () {
                        $(this).parent().removeClass('focus');
                    }
                });

                // 清空关键词
                $searchClear.on('click', function () {
                    $searchField.val('');
                    $(this).fadeOut();
                    $searchContent.html(render());
                });

                // 分页
                $searchContent.on('click', '[data-page]', function () {
                    var keywords = $searchField.val(),
                        page = $(this).data('page');

                    $searchContent.html(render(keywords, page));
                });

            });

            return this;
        }

    });

    // $(function () {
    //     $('[data-toggle="gsearch"]').gsearch();
    // });

})(jQuery);