# SteamStuff

This is a simple module that's designed to make it very easy to bootstrap a [node-steam](https://github.com/seishun/node-steam)-based bot.

# Installation

Install it from npm:

    $ npm install steamstuff

Or, add it to your `package.json` at the same time:

    $ npm install steamstuff --save

# Usage

It exports a single function, which you should call on both the `Steam` namespace provided by `node-steam`, and your instantiated `Steam.SteamClient`.

```js
var Steam = require('steam');
var SteamStuff = require('steamstuff');
var bot = new Steam.SteamClient();
SteamStuff(Steam, bot); // You're now benefiting from SteamStuff
```

# What It Does

- Automatically listens for `servers` event, saves server list, and applies it to `Steam.servers` on startup
- Automatically manages sentry files for Steam Guard and prompts for Steam Guard auth codes from stdin if necessary