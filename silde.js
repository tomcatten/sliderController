var browser = {
    version: (function() {
        var u = navigator.userAgent,
            app = navigator.appVersion;
        return { //移动终端浏览器版本信息
            trident: (/Trident/i).test(u), //IE内核
            presto: (/Presto/i).test(u), //opera内核
            webKit: (/AppleWebKit/i).test(u), //苹果、谷歌内核
            gecko: (/Gecko/i).test(u) && !(/KHTML/i).test(u), //火狐内核
            mobile: (/AppleWebKit.*Mobile.*/i).test(u), //是否为移动终端
            ios: (/\(i[^;]+;( U;)? CPU.+Mac OS X/i).test(u), //ios终端
            android: (/Android/i).test(u) || (/Linux/i).test(u), //android终端或者uc浏览器
            windowsphone: (/Windows Phone/i).test(u), //Windows Phone
            iPhone: (/iPhone/i).test(u), //是否为iPhone或者QQHD浏览器
            iPad: (/iPad/i).test(u), //是否iPad
            MicroMessenger: (/MicroMessenger/i).test(u), //是否为微信
            webApp: !(/Safari/i).test(u), //是否web应该程序，没有头部与底部
            edge: (/edge/i).test(u)
        };
    })(),
    language: (navigator.browserLanguage || navigator.language).toLowerCase()
};

window.SliderController = function(params) {
    this.params = $.extend(true, {
        mode: 'click'
    }, params);
    this._mouseIn = false;
};

window.SliderController.prototype = {
    pointer: 0,
    length: 0,
    timer: null,
    init: function() {
        var _this = this;
        var _params = this.params;
        if ($(_params.parent).find(".p-loading").length > 0) {
            this.loading = $(_params.parent).find(".p-loading");
        } else {
            this.loading = $('<div class="p-loading"></div>');
        }
        this.wrapper = $(_params.wrapper).appendTo($(_params.parent));
        this.container = this.wrapper.find("ul").eq(0);
        this.bar = $(_params.bar);
        if (_params.barContainer) {
            this.bar.appendTo(this.wrapper.find(_params.barContainer));
        } else {
            this.bar.appendTo(this.wrapper);
        }
        if (_params.dataSrc) {
            if ($(_params.parent).find(".p-loading").length == 0) {
                this.loading.appendTo(this.wrapper);
            }
            if (typeof _params.dataSrc == "string") {
                $.getJSON(_params.dataSrc, function(data) {
                    _this.loading.remove();
                    _this.load(data);
                });
            } else if (typeof _params.dataSrc == "object") {
                this.loading.remove();
                this.load(_params.dataSrc);
            }
        }
    },
    load: function(data) {
        var _this = this;
        var _params = this.params;
        var dataList;
        if (_params.onLoad) {
            dataList = _params.onLoad(data);
        } else {
            dataList = data.list ? data.list : data.result;
        }
        if (dataList) {
            for (var i in dataList) {
                if (typeof dataList[i] != "object") continue;
                if (_params.onData && _params.onData(dataList[i]) !== false || !_params.onData) {
                    this.add(dataList[i]);
                }
            }
        }
        if (this.length == 0) {
            var nodata = $('<li class="no-data">没有数据</li>').appendTo(this.container);
            this.bar.hide();
        }
        $("[bar]:eq(0)", this.bar).addClass("on");
        this.setTimer();

        if (_params.initCallback) {
            _params.initCallback(this.wrapper, data);
        }
    },
    add: function(data, callback) {
        var _this = this;
        var _params = this.params;
        var width = this.length * 100;
        var barItem = $(_params.barItem);
        barItem.appendTo(this.bar).attr("bar", "bar");
        var index = this.length;
        if (this.length == 0) {
            barItem.addClass("on");
        }
        if (_params.barRenderCallback) {
            _params.barRenderCallback(barItem, data, index);
        }
        var item;
        if (typeof _params.item == "function") {
            item = _params.item(data, index);
        } else {
            item = $(_params.item);
            $("img", item).attr("src", data.img);
            $("a", item).attr("href", data.link);
        }
        item.attr("preview", "preview");
        item.appendTo(this.container);
        if (_params.renderCallback) {
            _params.renderCallback(this.wrapper, data, index, item);
        }
        this.bindBarEvent(barItem);
        this.bindPreviewEvent(item);
        width += 100;
        this.length++;
        this.container.width(width + "%");
        if (typeof callback != "undefined") {
            callback(this.wrapper, data);
        }
    },
    bind: function() {
        var _this = this;
        var _params = this.params;
        this.wrapper = $(_params.wrapper);
        this.container = this.wrapper.find("ul").eq(0);
        this.bar = null;
        var items = this.container.children();
        this.length = items.length;
        this.container.width(this.length * 100 + "%");
        this.bindPreviewEvent(items);
        this.setTimer();
        if (_params.initCallback) {
            _params.initCallback(this.wrapper);
        }
    },
    bindBarEvent: function(elems) {
        var _this = this;
        if (browser === undefined || !browser.version.mobile && !browser.version.ios && !browser.version.android && !browser.version.windowsphone) {
            elems.hover(
                function() {
                    _this._mouseIn = true;
                    clearInterval(_this.timer);
                    if (_this.params.mode == 'hover') {
                        _this.slide($(this).index());
                    }
                },
                function() {
                    _this._mouseIn = false;
                    _this.setTimer();
                }
            );
        }
        elems.click(function() {
            _this.slide($(this).index());
        });
    },
    barHandler: function(index) {
        var el = this.bar.find("[bar]").eq(index);
        if (el.hasClass("on")) {
            return;
        }
        this.bar.find("[bar]").removeClass("on");
        el.addClass("on");
    },
    bindPreviewEvent: function(elems) {
        var _this = this;
        elems.hover(
            function() {
                clearInterval(_this.timer);
            },
            function() {
                _this.setTimer();
            }
        );
    },
    slide: function(i) {
        var _this = this;
        var _params = this.params;
        if (!this._mouseIn) {
            _this.setTimer();
        }
        this.container.stop(true, true).animate({
            "margin-left": -i * 100 + "%"
        }, 200);
        this.barHandler(i);
        if (this.pointer != i && _params.slideCallback) {
            _params.slideCallback(this.wrapper, i);
        }
        this.pointer = i;
    },
    setTimer: function() {
        var _this = this;
        var _params = this.params;
        clearInterval(this.timer);
        if (_params.timeout == 0 || this.length == 1) {
            return;
        }
        this.timer = setInterval(function() {
            _this.next();
        }, _params.timeout || 5000);
    },
    next: function() {
        this.slide(this.pointer < this.length - 1 ? this.pointer + 1 : 0);
    },
    prev: function() {
        this.slide(this.pointer > 0 ? this.pointer - 1 : this.length - 1);
    },
    destroy: function() {
        clearInterval(this.timer);
        this.wrapper.remove();
    }
};

window.renderBangumiPromoteSlider = function(data, ele, float) {
    //data 数据  ele元素  float指示条是否浮动
    var floatClass = float ? float : '';
    if (!!data) {
        var _this = this;
        var dataList = data.list ? data.list : data.result;
        if (!dataList.length) {
            return;
        }
        var sliderParams = {
            mode: 'hover',
            parent: ele ? ele : '.bangumi-pmt-slider',
            wrapper: $('<div class="mini-preview-wrapper"><div class="mini-preview-list-wrapper"><ul class="mini-preview"></ul></div><div class="s-bottom"><div class="info"></div></div></div>'),
            renderCallback: function(wrapper, data, index) {
                var info = $('<div class="info-item"><a class="t" href="' + data.link + '" title="' + data.title + '" target="_blank">' + data.title + '</a></div>').appendTo($(".info", wrapper));
                $("[preview] img", wrapper).eq(index).attr('alt', data.title);
                if (index == 0) {
                    info.show();
                }
            },
            slideCallback: function(wrapper, index) {
                $(".info .info-item", wrapper).stop().hide();
                $(".info", wrapper).find(".info-item:eq(" + index + ")").stop(true, true).fadeIn(300);
            },
            item: function(data, index) {
                if( ele == '.bm-hotspot .bm-pmt-slider'){
                    //影视区首页 热门推荐的轮播，增加大小图切换
                    return $('<li><a target="_blank" href="' + data.link + '" title="' + data.title + '"><img src="' + data.img + '" alt="' + data.title + '"><img src="' + data.simg + '" alt="' + data.title + '"></a></li>');
                }else{
                    return $('<li><a target="_blank" href="' + data.link + '" title="' + data.title + '"><img src="' + data.img + '" alt="' + data.title + '"></a></li>');
                }
            },
            bar: $('<ul class="slider-bar ' + floatClass + '"></ul>'),
            barContainer: ".s-bottom",
            barItem: '<li><a></a></li>',
            dataSrc: {
                list: dataList
            }
        };
        var slider = new SliderController(sliderParams);
        slider.init();
    }
};

var lazyAttr = 'lazy-src';
window.LazyLoad = function(images) {
    var els = images.slice(0);
    var len = els.length;
    var action = function() {
        var scrollTop = $(window).scrollTop();
        var currentTop = scrollTop + screen.height * 2;
        for (var i = 0, l = els.length; i < l; i++) {
            var el = $(els[i]);
            if (!el.attr('src') && el.attr(lazyAttr) && el.offset().top != scrollTop) {
                if (currentTop > el.offset().top) {
                    el.attr('src', el.attr(lazyAttr));
                    len--;
                }
            }
        }
        if (len <= 0) {
            $(window).off('touchmove touchend scroll', action);
        }
    };
    $(window).on('touchmove touchend scroll', action);
    action();
};


window.bfsImage = function(url, width, height) {
    if (!url) return url
        
    var reg = /i[0-2]/;
    if (reg.test(url)) {
        var baseUrl = url;
        var arr;
        var urlEnd = '';

        //带参分割字符串
        if (url.indexOf('?') >= 0) {
            arr = url.split('?');
            url = arr[0];
            urlEnd = '?' + arr[1];
        }

        if (url.indexOf('/bfs/') >= 0 || url.indexOf('/group1/') >= 0) {
            var reg = /_+[0-9]+x[0-9]/;
            if (reg.test(url)){
                return url
            }

            var imgtypeArr = url.split('.');
            var imgtype = imgtypeArr[imgtypeArr.length-1];
            url += '_' + width + 'x' + height + '.' + imgtype;

        } else {
            var reg = /\d+_\d+\//;
            if(reg.test(url)){
                url = url.replace(reg, '');
                // return baseUrl
            }
            
            url = url.replace('com/', 'com/' + width + '_' + height + '/');
        }
        url = url + urlEnd;
    }

    return url
}