
;(function(global) {

var doc = document;
var get = function(id){return doc.getElementById(id)},
  byClass = function(cls, dom){return (dom || doc).getElementsByClassName(cls)},
  byTag = function(tag, dom){return (dom || doc).getElementsByTagName(tag)};

function Like() {
  // register of callback for every (class, event) couple
  this.register = {};
  // classes that have the like-insert event
  this.insertClasses = [];
}

var proto = Like.prototype;
proto.get = get;
proto.byClass = byClass;
proto.byTag = byTag;

function iterate(obj, fct) {
  var i;
  for(i=0; i<obj.length; i++) {
    fct(obj[i]);
  }
}
proto.iterate = iterate;

proto.hasClass = function(dom, cls) {
  var m = new RegExp("(^|\\s+)" + cls + "(\\s+|$)");
  return dom.className && dom.className.match(m);
}

proto.addClass = function(dom, cls) {
  if(!this.hasClass(dom, cls)) {
    dom.className = dom.className + " " + cls;
  }
}

proto.removeClass = function(dom, cls) {
  var m = new RegExp("(^|\\s+)" + cls + "(\\s+|$)");
  dom.className = dom.className.replace(m, "");
}

proto.byClass = function(cls, dom) {
  var d = dom || document, accu, that=this;
  if(d.getElementsByClassName) {
    return d.getElementsByClassName(cls);
  } else if(d.all) {
    iterate(d.all, function(el) {
      if(that.hasClass(el, cls)) {
        accu.push(el);
      }
    });
  }
  return accu;
}

proto.execute = function(event) {
  var target = event.target, signature, that=this, response;
  while(target) {
    if(!target.className || target.className.indexOf("like-") == -1) {
      target = target.parentNode;
      continue;
    }
    iterate(target.className.split(" "), function(cls) {
      if(cls.indexOf("like-") == 0) {
        signature = cls + "|" + event.type;
        if(that.register[signature]) {
          response = that.register[signature](target, event);      
        }
      }
    });
    if(response === false) {
      break;
    }
    target = target.parentNode;
  }
}

proto.addEvent = function(className, eventName, callback) {
  var signature = className + "|" + eventName, that=this;
  // only one event by signature allowed
  if(!this.register[signature]) {
    function listener(e) {
      // IE fix
      e.target = e.target || e.srcElement
      that.execute(e);
    }
    doc.addEventListener(eventName, listener);
    this.register[signature] = callback;
    if(eventName == "like-insert") {
      this.insertClasses.push(className);
    }
    if(eventName == "like-init") {
      iterate(this.byClass(className), function(el) {
        callback(el, {type:"like-init", target:el});
      });
    }
  }
}

function eventDispatcher(obj) {
  return function(dom, event) {
    if(obj[event.type]) {
      return obj[event.type](dom, event);
    }
  }
}

proto.a = proto.an = function(name, reactOn, callback) {
  var events = reactOn.split(" "), i, that=this;
  if(typeof callback !== "function") {
    callback = eventDispatcher(callback);
  }
  iterate(events, function(evt) {
    that.addEvent("like-"+name, evt, callback);
  });
}

proto.domInserted = function(dom) {
  var that = this, signature;
  iterate(this.insertClasses, function(cls) {
    // search for dom element matching those classes
    iterate(that.byClass(cls, dom), function(el) {
       signature = cls + "|like-insert";
       if(that.register[signature]) {
         that.register[signature](el, {type:"like-insert", target:el});
       }
    });
  });
}

proto.insert = function(dom, html) {
  dom.innerHTML = html;
  this.domInserted(dom);
}


global.like = new Like();

}(this))

