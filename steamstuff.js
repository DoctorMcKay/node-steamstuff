var fs = require('fs');
var AppDirectory = require('appdirectory');
var dirs = new AppDirectory({
	"appName": "steamstuff",
	"appAuthor": "doctormckay"
});

// Make sure all levels of userData exist
var checkPath = '';
dirs.userData().replace(/\\/g, '/').split('/').forEach(function(dir) {
	checkPath += (checkPath ? '/' : '') + dir;
	if(!fs.existsSync(checkPath)) {
		fs.mkdirSync(checkPath, 0750);
	}
});

module.exports = SteamStuff;

function SteamStuff(Steam, client) {
	var oldLogOn = client.logOn;
	var lastLogOnDetails;
	
	try {
		var servers = fs.readFileSync(dirs.userData() + '/servers.json');
		Steam.servers = JSON.parse(servers);
	} catch(e) {
		// We don't care if it doesn't exist
	}
	
	client.logOn = function(details) {
		if(details.accountName && !details.shaSentryfile) {
			try {
				details.shaSentryfile = fs.readFileSync(dirs.userData() + '/sentry.' + details.accountName + '.sha1');
			} catch(e) {
				// We don't care if it doesn't exist
			}
		}
		
		lastLogOnDetails = details;
		
		oldLogOn.call(client, details);
	};
	
	client.on('error', function(e) {
		if(e.eresult == Steam.EResult.AccountLogonDenied) {
			var rl = require('readline').createInterface({
				"input": process.stdin,
				"output": process.stdout
			});
			
			rl.question('Steam Guard Code: ', function(code) {
				lastLogOnDetails.authCode = code;
				client.logOn(lastLogOnDetails);
			});
		} else if(client.listeners('error') == 1) {
			throw e; // Emulate standard EventEmitter behavior
		}
	});
	
	client.on('sentry', function(hash) {
		fs.writeFileSync(dirs.userData() + '/sentry.' + lastLogOnDetails.accountName + '.sha1', hash);
	});
	
	client.on('servers', function(servers) {
		fs.writeFileSync(dirs.userData() + '/servers.json', JSON.stringify(servers, undefined, "\t"));
	});
}