

function chainify(clazz) {
  var Chain = function() {};
  
  Chain.prototype.exec = function() {
    return this.c_process();
  };

  Chain.prototype.c_chain = function(func, args) {
    if (!func)
      throw new Error('Provide a function to be chained.');
    
    var manager;
    if (!this.hasOwnProperty('manager')) {
      manager = {
        base : this,
        timerId : null,
        executing : false,
        queue : []
      };
    } else {
      manager = this.manager;
    }
    
    var f = function() {};
    f.prototype = manager.base.constructor.prototype;
    f.prototype.constructor = f;
    
    var obj = function(func, args, cb, manager) {
      this.func = func;
      this.args = args;
      this.cb = cb;
      this.manager = manager;
    };
    obj.prototype = new f();
    obj.prototype.constructor = obj;
    
    var argsTmp = null;
    var cb = null;
    if (args) {
      argsTmp = args;
      
      // check if last arg is a function
      // if so, register it as callback
      if (args.length > 0) {
        if (typeof args[args.length-1] === 'function') {
          cb = args[args.length-1];
        }
      }
    }
    
    var objIns = new obj(func, argsTmp, cb, manager);
    objIns.manager.queue.push(objIns);
    objIns.manager.timerId = setTimeout(function() { objIns.c_process(); }, 1);
    return objIns;
  };
                
  Chain.prototype.c_process = function() {
    var self = this;
    if (!this.manager)
      return this;
    
    if (this.manager.timerId)
      clearTimeout(this.manager.timerId);
  
    if (this.manager.queue.length > 0) {
      var elem = this.manager.queue.shift();
      
      var context = this;
      context.c_next = function() {
        if (elem.cb) {
          var context = this;
          context.c_next = function() {
            self.c_process.apply(self);
          };
          elem.cb.apply(context);
      
        } else {
          self.c_process.apply(self);
        }
      };
      
      elem.func.apply(context, elem.args);
    }
    return this;
  };
      
  Chain.prototype.c_clear = function() {
    if (!this.manager)
      return this;
    
    if (this.manager.timerId)
      clearTimeout(this.manager.timerId);
    if (this.manager.queue)
      this.manager.queue.length = 0;
    return this;
  };
    
  Chain.prototype.c_delay = function() {
    if (!this.manager)
      return this;
    
    if (this.manager.timerId)
      clearTimeout(this.manager.timerId);
    return this;
  };
      
  Chain.prototype.c_getSuccessors = function() {
    if (!this.manager)
      return [];
    
    if (this.manager.queue)
      return this.manager.queue;
    return [];
  };
    
  Chain.prototype.c_getPredecessors = function() {
    if (!this.manager)
      return [];
    
    if (this.manager.queue)
      return this.manager.queue;
    return [];
  };

  for (var prop in Chain.prototype)
    clazz.prototype[prop] = Chain.prototype[prop];
  return clazz;
}