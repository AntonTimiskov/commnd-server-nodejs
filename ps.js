function PS(){
  var thisPS = this;
  this.PS = this;
  var server_url = 'http://'+context.host+':'+context.server_instance_port+'/';
  this.deferreds = [];
  
  function _invoke(data){
    console.log('do invoke', data);
    var dfd = new $.Deferred();
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
        path: 'C:\\SAIP\\SharePoint Information Portal\\Application\\tests\\cases\\libraries' 
      },
      success: function(out) {
        $('#section1 .output').html(out.replace('/\r/g', '<br/>'));
        console.log('out', out);
        dfd.resolve();
      }, 
      error: function(a,b,error){
        var out = error.message;
        $('#section1 .output').html(out.replace('/\r/g', '<br/>'));
        console.log('err', out);
        dfd.reject();
      }
    });
    return dfd.promise();
  }
  this.invoke = function(method, arg1, arg2, arg3){
    console.log(this, 'invoke', arguments);
    var dfd = new $.Deferred();
    var args = Array.prototype.slice.call(arguments).slice(1);
    var data =  method + '('+ $.map(args, function(i){ 
      if ( typeof i == 'string' ) return '"'+i+'"'; 
      if ( typeof i == 'boolean' ) return '$'+i; 
      return i; 
    }).join(',') + ')';
    console.log(data, arguments, args);
    this.deferreds.push(function() { return _invoke(data);});
    return this;
  };
  this.then = function(callback){
    console.log(this, 'then', arguments);
    var busy = false,
        funcs = this.deferreds;
    
    (function loop(){
      if ( funcs.length == 0 ) {
        callback();
        return; 
          }
      if ( ! busy ) {
        var fn = funcs.shift();
        busy = true;
        fn().then(function(){
          busy = false;
        });
      }
      setTimeout(loop, 100);
    })();
  };
}


