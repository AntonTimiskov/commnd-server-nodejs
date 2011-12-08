var ws = $.websocket("ws://127.0.0.1:8080/", {
		open: function(){
			console.log('WebSocket opened', arguments);
		},
		close: function(){
			console.log('WebSocket closed', arguments);
		},
		message: function(){
			console.log('Message:', arguments);	
		},
        events: {
                message: function(e) { 
					$(document).trigger('websocket.message', [e.data]);
				}
        }
});

