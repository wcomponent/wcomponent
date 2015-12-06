(function(){
    'use strict';
    var 
        win = window,
        doc = document,
        TRIM_REGEXP = /[\s]+|[\s]+/g;

    var iUse = {
        shadow: 'createShadowRoot' in Element.prototype,
        htmlImport: 'import' in HTMLLinkElement.prototype,
        observe: 'observe' in Object
    };

    var binders = {
        submit: function(node, key, object){
            var ev = binders.events(node, 'submit', object);
            ev.update(function(ev){
                console.log('type', key);
                var fn = object.events[key];
                if(fn){
                    fn.apply(this, arguments);
                }
            });
            return {
                update: function(fn){
                    fn && fn.apply(object, arguments);
                }
            }
        },
        events: function(node, type, object, eventName){
            var previous;
            return {
                update: function(fn){
                    var listener = function(ev){
                        fn.apply(object, arguments);
                        ev.preventDefault();
                    };
                    if(previous) {
                        node.removeEventListener(type, previous);
                        previous = listener;
                    }
                    node.addEventListener(type, listener);
                }
            };
        },
        model: function(node, key, object){
            var ev = binders.events(node, 'keyup', object);
            var value = node.value;
            ev.update(debounce(function(){
                object.model[key] = node.value;
            }, 10));
            return {
                update: function(value){
                    if(value !== node.value){
                        this.oldValue = node.value;
                        node.value = value;
                    }
                },
                oldValue: value
            };
        },
        bind: function(node){
            return {
                update: function(value){
                    node.textContent = value;
                }
            };
        }
    };

    WComponent.components = {};

    window.WComponent = WComponent;

    function bindObject(node, object){
        Object.keys(node.dataset || {}).forEach(function(key){
            var args, valueKey, parts, part1, part2, value, binder;
            valueKey = node.dataset[key];
            parts = key.replace(TRIM_REGEXP, '').split(':');
            part1 = parts[0];
            part2 = parts[1];
            if(part1 in binders){
                args = [node];
                if(part2){
                    args = args.concat([part2, object, valueKey])
                } else {
                    args = args.concat([valueKey, object]);
                }
                binder = binders[part1].apply(null, args);
                value = part1 === 'events' ? object.events[valueKey] : object.model[valueKey];
                binder.update(value);
            }

            var observer = function(changes){
                var changed = changes.some(function(change){
                    return change.name === valueKey
                });
                if(changed){
                    binder.update(object[valueKey])
                }
            };

            if(iUse.observe) {
                Object.observe(object, observer);
                return {
                    unobserve: function(){
                        Object.unobserve(object, observer);
                    }
                }
            } else {
                dirtyCheckObject(object, observer);
                return {
                    unobserve: function(){

                    }
                }
            }
        });
    }

    function dirtyCheckObject(object, observer){
        delay(function(){
            //
        }, 60);
    }

    function ArrayFilter(collection, fn){
        return Array.prototype.filter.call(collection, fn);
    }

    function ArraySlice(collection, off){
        return Array.prototype.slice.call(collection, off);
    }

    function bindModel(element, object){
        var dataAttrs = ['model', 'bind', 'submit'];
        var bindings = [];
        dataAttrs.forEach(function(attr){
            var selector = '[data-'+attr+']';
            var collection = element.querySelectorAll(selector);
            bindings.concat(ArrayFilter(collection, function(node){
                node = node.parentNode;
                while(node){
                    if(node.dataset && node.dataset.repeat){
                        return false;
                    }
                    node = node.parentNode;
                }
                return true;
            })
            .map(function(node){
                bindObject(node, object);
                return node;
            }));
        });

        return {
            unobserve: function() {
                bindings.forEach(function(binding) {
                    binding.unobserve();
                });
            }
        };
    }

    function WComponent(name, options){
        var 
            component,
            element,
            events,
            registeredElement,
            elementDef = {},
            basePrototype,
            _extends,
            template,
            callbacks,
            _name = toHTMLElement(name),
            _HTMLElement = getHTMLElement(_extends),
            proto;

        component = WComponent.components[_name] = options || {};
        component.name = name;
        basePrototype = component.prototype;
        _extends = component['extends'];
        template = component['template'];
        callbacks = component.callbacks || {};
        events = component.events;
        proto = Object.create(basePrototype || {});
        
        var script = (document.currentScript || document._currentScript);
        if(script){
            element = script.parentNode;
        } else {
            element = document.querySelector(['name='+name]);
        }
        if(element){
            template = element.querySelector('template');
        }

        proto.createdCallback = {
            enumerable: true, 
            writable: true,
            value: function(){
                if(callbacks.created){
                    callbacks.created.call(component, this);
                }
                createdCallback.apply(this, arguments);
            }
        };

        proto.attachedCallback = {
            enumerable: true,
            writable: true,
            value: function(){
                attachedCallback.apply(this, arguments);
                if(callbacks.attached){
                    callbacks.attached.apply(this, arguments);
                }
            }
        };

        proto.detachedCallback = {
            enumerable: true,
            writable: true,
            value: function(){
                detachedCallback.apply(this, arguments);
                if(callbacks.detached){
                    callbacks.detached.apply(this, arguments);
                }
            }
        };

        proto.attributeChangedCallback = {
            enumerable: true,
            writable: true,
            value: function(){
                attributeChangedCallback.apply(this, arguments);
                if(callbacks.attributeChanged){
                    callbacks.attributeChanged.apply(this, arguments);
                }
            }
        }

        elementDef['prototype'] = Object.create(_HTMLElement.prototype, proto);

        if(_extends){
            elementDef['extends'] = _extends;
        }
        
        registeredElement = win[_name] = document.registerElement(name, elementDef);

        return registeredElement;

        function createdCallback(){
            var element = this;
            var content = getTemplateContent(template);
            var data = {};
            if(content) {
                if(iUse.shadow){
                     element = this.createShadowRoot();
                }
                element.appendChild(content.cloneNode(true));
            }
            bindModel(element, options);
        }

        function attachedCallback(){}

        function detachedCallback() {}

        function attributeChangedCallback(){}
    }

    function getTemplateContent(template){

        if(!template){
            return undefined;
        }
        if(template.content){
            return template.content;
        }
        var templateElement = document.createElement('template');
        if(template.firstChild){
            var child;
            while(child = template.firstChild){
                templateElement.appendChild(child);
            }
        } else {
            templateElement.innerHTML = template;
        }
       
        return templateElement.content;
    }

    function getHTMLElement(name){
        return (
            (name && (document.createElement(name)).constructor) 
            || window.HTMLElement
        );
    }

    function toHTMLElement(name){
        return ['HTML', (name ? toTitleCase(name) : ''), 'Element'].join('');
    }

    function toTitleCase(str){
        return str.replace(/([^a-z])+(.)?/g, function($1, $2, $3){ 
          return $3 ? $3.toUpperCase() : '';
        }).replace(/^[a-z]/, function($1){ 
            return $1.toUpperCase(); 
        });
    }

    function debounce(func, wait, immediate) {
        var timeout, args, context, timestamp, result;
        var now = Date.now || function(){(new Date).getTime()};
        var later = function() {
          var last = now() - timestamp;

          if (last < wait && last >= 0) {
            timeout = setTimeout(later, wait - last);
          } else {
            timeout = null;
            if (!immediate) {
              result = func.apply(context, args);
              if (!timeout) context = args = null;
            }
          }
        };

        return function(ev) {
          context = this;
          args = arguments;
          timestamp = now();
          var callNow = immediate && !timeout;
          if (!timeout) timeout = setTimeout(later, wait);
          if (callNow) {
            result = func.apply(context, args);
            context = args = null;
          }
          ev.preventDefault();
          return result;
        };
      }

      function delay(func, wait) {
        var args = ArraySlice.call(arguments, 2);
        return setTimeout(function(){
          return func.apply(null, args);
        }, wait);
      }

})();