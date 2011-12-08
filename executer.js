var sys = require('util'),
	url = require('url'),
	child = require('child_process');

function ScriptExecuter(type, lines) {
	console.log(arguments, type, lines);
	var options = { type: type, lines: lines };
	var fn = function(){ console.log('Invalid type specified'); };
	if ( type == 'ps' ) { fn = PowerShellExecuter; }
	if ( type == 'py' ) { fn = PythonExecuter; }
	console.log(type, fn);
	return {
		run: function(stdout_callback, stderr_callback){
			fn(options.lines, function(out, err, exit) {
				if ( err.length && err.length > 0) {
					stderr_callback( exit, err);
					stdout_callback( exit, err );
					return;
				}
				stdout_callback( exit, out );
			});
		}
	}	
};

function ProcessExecuter(cmd, args, lines, callback){
	args = args || [];
	args.push(lines);
	var shell = child.spawn(cmd, args);
	var out = '',
		err = '',
		exit_code = 0;

	shell.stdout.on('data', function (data) {
	  //console.log(cmd+' stdout: ' + data);
	  out = out + data;
	});

	shell.stderr.on('data', function (data) {
	  //console.log(cmd+' stderr: ' + data);
	  err = err + data;
	});

	shell.on('exit', function (code) {
		//console.log(cmd+' exited with code ' + code);
		exit_code = code;
		console.log(out, err)
		callback( out, err, exit_code );
	});

	shell.stdin.end();
};

function PowerShellExecuter(lines, callback) {
	lines = 'set-executionpolicy bypass\nGet-ChildItem "c:\\pslibs\\*.ps1" | %{.$_}\n' + lines;
	console.log(lines);
	return ProcessExecuter('powershell.exe', [], lines, callback);
};

function PythonExecuter(lines, callback) {
	return ProcessExecuter('c:\\python26x64\\python.exe', ['-c'], lines, callback);
};

/*
ScriptExecuter('ps', 'Write-Host "Hello from Powershell!"\nWrite-Host "Hello3"')
	.run(function(code, msg){
			console.log('PS out: '+msg)
		}, function(code, msg){
			console.log('PS err: '+msg)
		});

ScriptExecuter('ps', 'ErrorStatement')
	.run(function(code, msg){
			console.log('PS out: '+msg)
		}, function(code, msg){
			console.log('PS err ('+code+'): '+msg)
		});


ScriptExecuter('py', 'print "Hello from Python"\nprint "Hello2"')
	.run(function(code, msg){
			console.log('Py out: '+msg)
		}, function(code, msg){
			console.log('Py err: '+msg)
		});
*/

var http = require('http');
http.createServer(function (req, res) {
	var params = url.parse(req.url, true).query;
	console.log(params, params.type, params.data);
	function wrap_jsonp(msg) {
		return	params.callback+'(\''+
				msg.replace(/'/g,'"').replace(/\\/g,'\\\\').split('\r\n').join('\'+\n\'')+
				'\');';
	}
	ScriptExecuter(params.type, params.data)
		.run(function(code, msg){
            console.log(params.type+' out: '+msg);
			if ( params.json ) { msg = wrap_jsonp(msg);	}
			res.end(msg);
        }, function(code, msg){
            console.log(params.type+' err ('+code+')')
			res.writeHead( (code == 0) ? 200 : 500, {'Content-Type': 'text/plain'});
        });
	}).listen(8080, "0.0.0.0");
console.log('Server running at http://0.0.0.0:8080/');



