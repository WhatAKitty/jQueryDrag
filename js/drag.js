/* =========================================================
 * drag.js 
 * =========================================================
 * Copyright 2015 许强
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */
 
(function($, window, document){
    
    var Drag = function(element, options) {
        this._process_options(options);
        this.element = $(element);
        this._init();
        
        this._buildEvents();
        this._attachEvents();
            
        return this;
    }
    
    Drag.prototype = {
        constructor: Drag,
        
        _process_options : function(opts) {
            // Store raw options for reference
            this._o = $.extend({}, this._o, opts);
            // Processed options
            var o = this.o = $.extend({}, this._o);
        },
        _events: [],
        _applyEvents: function(evs){
            for (var i=0, el, ch, ev; i < evs.length; i++){
                el = evs[i][0];
                if (evs[i].length === 2){
                    ch = undefined;
                    ev = evs[i][1];
                }
                else if (evs[i].length === 3){
                    ch = evs[i][1];
                    ev = evs[i][2];
                }
                el.on(ev, ch);
            }
        },
        _unapplyEvents: function(evs){
            for (var i=0, el, ev, ch; i < evs.length; i++){
                el = evs[i][0];
                if (evs[i].length === 2){
                    ch = undefined;
                    ev = evs[i][1];
                }
                else if (evs[i].length === 3){
                    ch = evs[i][1];
                    ev = evs[i][2];
                }
                el.off(ev, ch);
            }
        },
        _buildEvents: function() {
        },
        _attachEvents: function(){
            this._detachEvents();
            this._applyEvents(this._events);
        },
        _detachEvents: function(){
            this._unapplyEvents(this._events);
        },
        
        _setAttr: function(key, value) {
            var opt = this.o,
                $ele = this.element;
            
            $ele.data(key, value);
            return this;
        },
        _getAttr: function(key) {
            var $ele = this.element;
            
            return $ele.data(key);
        },
        
        _init: function() {
            var opt = this.o,
                events = this._events,
                $ele = this.element;
                
            var position = $ele.css("position");
            if(!position || position !== "absolute") $ele.css("position", "absolute");
            
            events.push(
                [$ele, {
                    mousedown: $.proxy(function(e) {
                        var $target = this.element,
                            target = e.currentTarget,
                            clientX = $target.offset().left,
                            clientY = $target.offset().top,
                            offsetWidth = opt.offsetW,
                            offsetHeight = opt.offsetH;
                        
                        // 初始化left和top
                        var left = offsetWidth ? +offsetWidth + +clientX : clientX,
                            top = offsetHeight ? +offsetHeight + +clientY : clientY;
                        
                        this._process_options({
                            "initX": left,
                            "initY": top,
                            "isDragging": true,
                            "left": left,
                            "top": top
                        });
                        
                        if(target.setCapture){
                            target.setCapture();
                        }else if(window.captureEvents){
                            window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
                        }
                    }, this),
                    mousemove: $.proxy(function(e) {
                        var $target = this.element,
                            target = e.currentTarget,
                            opt = this._o,
                            maxRangeWidth = opt.maxRangeW,
                            maxRangeHeight = opt.maxRangeH,
                            clientX = e.clientX,
                            clientY = e.clientY;
                            
                        if(opt.draggable && opt.isDragging) {
                            var clientMax = this._getViewSizeWithoutScrollbar(),
                                offsetWidth = opt.offsetW,
                                offsetHeight = opt.offsetH;
                            
                            // 计算当前left、top和最大范围width、height
                            var left = offsetWidth ? +offsetWidth + +clientX : clientX,
                                top = offsetHeight ? +offsetHeight + +clientY : clientY;
                                
                            if(clientMax.width <= clientX || clientMax.height <= clientY || clientX < 0 || clientY < 0) {
                                return false;
                            }
                            if(maxRangeWidth && (left > +maxRangeWidth[1] + +opt.initX || left < opt.initX - maxRangeWidth[0])) {
                                return false;
                            }
                            if(maxRangeHeight && (top > +maxRangeHeight[1] + +opt.initY || top < opt.initY - maxRangeHeight[0])) {
                                return false;
                            }
                            
                            this._process_options({
                                "left": left,
                                "top": top
                            });
                            
                            if(maxRangeWidth) {
                                $target.css("left", left + "px");
                            }
                            if(maxRangeHeight) {
                                $target.css("top", top + "px");
                            }
                            $target.trigger("dragging", [left, top]);
                        }
                    }, this),
                    mouseup: $.proxy(function(e) {
                        var target = e.currentTarget,
                            opt = this._o,
                            left = opt.left,
                            top = opt.top,
                            maxRangeWidth = opt.maxRangeW,
                            maxRangeHeight = opt.maxRangeH;
                        
                        if(target.releaseCapture){
                            target.releaseCapture();
                        }else if(window.captureEvents){
                            window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
                        }
                        
                        var maxRangeW = maxRangeWidth && [maxRangeWidth[0] + (left - opt.initX), maxRangeWidth[1] - (left - opt.initX)],
                            maxRangeH = maxRangeHeight && [maxRangeHeight[0] + (top - opt.initY), maxRangeHeight[1] - (top - opt.initY)];
                        
                        this._process_options({
                            "initX": opt.left,
                            "initY": opt.top,
                            "left": undefined,
                            "top": undefined,
                            "maxRangeW": maxRangeW,
                            "maxRangeH": maxRangeH,
                            "isDragging": false
                        });
                    }, this)
                }]
            );
        },
        _caculateMaxRange: function() {
            var opt = this._o,
                left = opt.left,
                top = opt.top,
                initX = opt.initX,
                initY = opt.initY,
                maxRangeWidth = opt.maxRangeW,
                maxRangeHeight = opt.maxRangeH;
                
            var maxRangeW = maxRangeWidth && [maxRangeWidth[0] + (left - initX), maxRangeWidth[1] - (left - initX)],
                maxRangeH = maxRangeHeight && [maxRangeHeight[0] + (top - initY), maxRangeHeight[1] - (top - initY)];
                
            this._process_options({
                "maxRangeW": maxRangeW,
                "maxRangeH": maxRangeH
            });
        },
        _getViewSizeWithoutScrollbar: function() {
            return {
                width : document.documentElement.clientWidth,
                height: document.documentElement.clientHeight
            }
        },
        getEndXY: function() {
            
        }
    };
    
    $.fn.drag = function( option, val ) {
        var internal_return;
        this.each(function () {
            var $this = $(this),
                data = $this.data('drag'),
                options = typeof option === 'object' && option;
            if (!data) {
                $this.data('drag', (data = new Drag(this, $.extend({}, $.fn.drag.defaults,options))));
            }
            if (typeof option === 'string') internal_return = data[option](val);
        });
        if (internal_return !== undefined)
            return internal_return;
        else
            return this;
    }
    
    $.fn.drag.defaults = {
        draggable: true,
        isDragging: false,
        maxRangeW: undefined,
        maxRangeH: undefined,
        offsetW: undefined,
        offsetH: undefined,
        derection: "we" // 可拖动的方向：n:向北,e:向东,s:向南,w:向西
    }
    $.fn.drag.Constructor = Drag;
    
}(window.jQuery, window, document));