var sys = require('util'),
	temp = require('./temp'),
	url = require('url'),
	fs = require('fs'),
	child = require('child_process');

function ScriptExecuter(type, lines, paths) {
	//console.log(arguments, type, lines);
	var fn = function(){ console.log('Invalid type specified'); };
	if ( type == 'ps' ) { fn = PowerShellExecuter; }
	if ( type == 'py' ) { fn = PythonExecuter; }
	//console.log(type, fn);
	return {
		run: function(stdout_callback, stderr_callback){
			fn(lines, function(out, err, exit) {
				if ( err.length && err.length > 0) {
					stderr_callback( exit, err);
					stdout_callback( exit, err );
					return;
				}
				stdout_callback( exit, out );
			}, paths);
		}
	}	
};

function ProcessExecuter(cmd, args, tempfile, lines, callback){
	args = args || [];
    console.log(cmd, args.join(' '));	
	fs.writeFile(tempfile, lines, function(){
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
			//console.log(out, err)
			callback( out, err, exit_code );
			fs.unlink(tempfile);
		});

		shell.stdin.end();
	});
};

function PowerShellExecuter(lines, callback, paths) {
	var cmd = '';//'set-executionpolicy bypass\n';
	for (var i=0; i < paths.length; i++) {
		cmd += 'Get-ChildItem "'+paths[i]+'\\*.ps1" | %{.$_}\n';
	}
	cmd += lines;
	
	console.log(cmd);
	var tempfile = temp.path() + '.ps1';
	return ProcessExecuter('powershell.exe', ['-NonInteractive', '-ExecutionPolicy', 'unrestricted', '-File', tempfile], tempfile, cmd, callback);
};

function PythonExecuter(lines, callback) {
	return ProcessExecuter('c:\\python26x64\\python.exe', ['-c'], lines, callback);
};

var http = require('http');
http.createServer(function (req, res) {
	var params = url.parse(req.url, true).query;
	//console.log(params, params.type, params.data);
	function wrap_jsonp(msg) {
		return	params.callback+'(\''+
				msg.replace(/'/g,'"').replace(/\\/g,'\\\\').split('\r\n').join('\'+\n\'')+
				'\');';
	}
	ScriptExecuter(params.type, params.data, [params.path])
		.run(function(code, msg){
            console.log(params.type+' out: '+msg);
			if ( params.json ) { msg = wrap_jsonp(msg);	}
			res.end(msg);
        }, function(code, msg){
            console.log(params.type+' err ('+code+')')
			res.writeHead( (code == 0) ? 200 : 500, {'Content-Type': 'text/plain'});
			res.end(msg);
        });
	}).listen(8080, "0.0.0.0");
console.log('Server running at http://0.0.0.0:8080/');



