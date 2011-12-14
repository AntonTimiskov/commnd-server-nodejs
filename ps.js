function PS(reject_on_fail){
  var thisPS = this;
  this.PS = this;
  this.reject_on_fail = reject_on_fail;
  var server_url = 'http://'+context.host+':'+context.server_instance_port+'/';
  this.deferreds = [];
  
  function _invoke(data){
    console.log('do invoke', data);
    var dfd = new $.Deferred();
    var random = Math.floor( Math.random() * 1000000000 ).toString();
    var errorCallbackName = 'error' + random;
    var successCallbackName = 'success' + random;
    
    window[errorCallbackName]  = function(out){
      QUnit.log('PS ERROR: ', out);
      if ( reject_on_fail ) {
        dfd.reject();
      } else {
        dfd.resolve();
      }
    };
    window[successCallbackName]  = function(out){
      console.log('success', arguments);
      QUnit.log('PS OK', out);
      dfd.resolve();
    };
    
    $.ajax({
      url: server_url,
      dataType: 'jsonp',
      cache: false,
      async: true,
      method: 'GET',
      data: {
        type: 'ps',
        data: data,
        json: true,
        callback: successCallbackName,
        error: errorCallbackName,
        path: 'C:\\SAIP\\SharePoint Information Portal\\Application\\tests\\cases\\libraries'
      },
      complete: function(){
        console.log(arguments);
      }
    });
    return dfd.promise();
  }
  
  this.failCallback = function(){};
  this.invoke = function(method, arg1, arg2, arg3){
    console.log(this, 'invoke', arguments);
    var dfd = new $.Deferred();
    var args = Array.prototype.slice.call(arguments).slice(1);
    var data =  method + ' '+ $.map(args, function(i){
      if ( typeof i == 'string' ) return '"'+i+'"';
      if ( typeof i == 'boolean' ) return '$'+i;
      return i;
    }).join(' ');
    console.log(data, arguments, args);
    this.deferreds.push(function() { return _invoke(data);});
    return this;
  };
  this.then = function(callback){
    console.log(this, 'then', arguments);
    var busy = false,
        funcs = this.deferreds,
        gotError = false;
    
    (function loop(){
      if ( funcs.length == 0 ) {
        if ( ! gotError ) callback();
        return;
          }
      if ( ! busy ) {
        var fn = funcs.shift();
        busy = true;
        fn().done(function(){
          busy = false;
        }).fail(function(){
          funcs = [];
          busy = false;
          gotError = true;
          thisPS.failCallback();
        });;
      }
      setTimeout(loop, 100);
    })();
    return this;
  };
  this.fail = function(callback){
    this.failCallback = callback;
    reject_on_fail = true;
    return this;
  };
}


