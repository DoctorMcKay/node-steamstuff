var fs = require('fs');

module.exports = SteamStuff;

function SteamStuff(Steam, client) {
	var scriptRoot = require('path').dirname(require.main.filename);
	
	var oldLogOn = client.logOn;
	var lastLogOnDetails;
	
	try {
		var servers = fs.readFileSync(scriptRoot + '/servers.json');
		Steam.servers = JSON.parse(servers);
	} catch(e) {
		// We don't care if it doesn't exist
	}
	
	client.logOn = function(details) {
		if(details.accountName && !details.shaSentryfile) {
			try {
				details.shaSentryfile = fs.readFileSync(scriptRoot + '/sentry.' + details.accountName + '.sha1');
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
		} else {
			client.emit('steamstuff-error', e);
		}
	});
	
	client.on('sentry', function(hash) {
		fs.writeFileSync('sentry.' + lastLogOnDetails.accountName + '.sha1', hash);
	});
	
	client.on('servers', function(servers) {
		fs.writeFileSync('servers.json', JSON.stringify(servers, undefined, "\t"));
	});
}