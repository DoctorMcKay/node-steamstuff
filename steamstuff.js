var fs = require('fs');
var AppDirectory = require('appdirectory');
var dirs = new AppDirectory({
	"appName": "steamstuff",
	"appAuthor": "doctormckay"
});

// Make sure all levels of userData exist
var checkPath = '';
dirs.userData().replace(/\\/g, '/').split('/').forEach(function(dir, index) {
	if(index === 0 && !dir) {
		checkPath = '/';
	} else {
		checkPath += (checkPath ? '/' : '') + dir;
	}
	
	if(!fs.existsSync(checkPath)) {
		fs.mkdirSync(checkPath, 0750);
	}
});

module.exports = SteamStuff;

function SteamStuff(Steam, client) {
	var oldLogOn = client.logOn;
	var lastLogOnDetails;
	
	try {
		Steam.servers = JSON.parse(fs.readFileSync(dirs.userData() + '/servers.json'));
	} catch(e) {
		// We don't care if it doesn't exist
	}
	
	client.logOn = function(details) {
		if(details.accountName && !details.shaSentryfile) {
			if(fs.existsSync(dirs.userData() + '/sentry.' + details.accountName + '.bin')) {
				details.shaSentryfile = fs.readFileSync(dirs.userData() + '/sentry.' + details.accountName + '.bin');
			} else if(fs.existsSync(dirs.userData() + '/sentry.' + details.accountName + '.sha1')) {
				details.shaSentryfile = fs.readFileSync(dirs.userData() + '/sentry.' + details.accountName + '.sha1');
			}
		}
		
		lastLogOnDetails = details;
		
		oldLogOn.call(client, details);
	};
	
	client.on('error', function(e) {
		if(e.eresult == Steam.EResult.AccountLogonDenied || e.eresult == Steam.EResult.AccountLogonDeniedNeedTwoFactorCode) {
			var rl = require('readline').createInterface({
				"input": process.stdin,
				"output": process.stdout
			});
			
			rl.question('Steam Guard ' + (e.eresult == Steam.EResult.AccountLogonDenied ? 'Email' : 'App') + ' Code: ', function(code) {
				if(e.eresult == Steam.EResult.AccountLogonDeniedNeedTwoFactorCode) {
					lastLogOnDetails.twoFactorCode = code;
				} else {
					lastLogOnDetails.authCode = code;
				}
				
				client.logOn(lastLogOnDetails);
				
				rl.close();
			});
		} else if(client.listeners('error') == 1) {
			throw e; // Emulate standard EventEmitter behavior
		}
	});
	
	client.on('sentry', function(sentry) {
		fs.writeFileSync(dirs.userData() + '/sentry.' + lastLogOnDetails.accountName + (sentry.length == 20 ? '.sha1' : '.bin'), sentry);
	});
	
	client.on('servers', function(servers) {
		fs.writeFileSync(dirs.userData() + '/servers.json', JSON.stringify(servers, undefined, "\t"));
	});
}
