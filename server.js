import mongoose from 'mongoose';
import axios from 'axios';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const WebSocket = require('ws');

const Bots = require('./api/models/bots');

// Keys for jwt verification
const key = process.env.TWITCH_SHARED_SECRET;
const clientId = process.env.TWITCH_CLIENT_ID;
const defaultSecret = Buffer.from(key, 'base64');

// Setup websocket server for communicating with the panel
const wss = new WebSocket.Server({ port: 8082 });

let clients = {};
let panels = {};

const hmacSHA1 = (hmacSecret, data) => {
    return crypto.createHmac('sha1', hmacSecret).update(data).digest().toString('base64');
}

// TODO Update this to helix soon
const getTwitchProfile = async (userId) => {
    let url = `https://api.twitch.tv/kraken/users/${userId}`;
    console.log(`URL : ${url}`);
    let res = await axios.get(url, {
        headers: {
            "Client-ID": clientId,
            Accept: "application/vnd.twitchtv.v5+json"
        }
    });

    return res.data;
}

const twitchCache = {};
const getTwitchUsername = async (userId) => {
    if (twitchCache[userId]) {
        return twitchCache[userId];
    }

    let profile = await getTwitchProfile(userId);
    twitchCache[userId] = profile.name;

    return profile.name;
}

// Set up a websocket routing system
wss.on('connection', async (ws) => {
    console.log("CONNECTION");
    ws.on('close', async () => {
        console.log("Websocket closed, cleaning up.");

        // Remove dead connections (TODO this apparently doesn't work perfectly yet)
        Object.keys(clients).filter((key) => {return clients[key].readyState !== WebSocket.OPEN}).forEach((key) => {
            console.log("Removing dead connection for client: " + key);
            delete clients[key];

            // Close websockets that are connected to bot
            let channelId = key.replace("BOT-", "");
            panels[channelId].forEach((panel) => {
                panel.close();
            });
            delete panels[channelId];
        });

        // Remove dead panels
        Object.keys(panels).forEach((channelId) => {
            let channelPanels = panels[channelId];
            panels[channelId] = channelPanels.filter((channelPanel) => {return channelPanel.readyState === WebSocket.OPEN});
        });

        console.log("BOTS CONNECTED: " + Object.keys(clients).length);
    });
    ws.on('message', async (message) => {
        let event = JSON.parse(message);

         // Panel requests don't need jwt authentication
         if (event.from === "PANEL" && event.type === "REGISTER_PANEL") {
            let to = clients[`BOT-${event.channelId}`];
            if (!to) {
                console.error("Cannot find client");
                ws.close();
                return;
            }

            if (!panels[event.channelId]) {
                panels[event.channelId] = [];
            }
            panels[event.channelId].push(ws);
            console.log("REGISTERED PANEL FOR CHANNEL ID " + event.channelId);

            let toBot = await Bots.findOne({twitchChannelId: event.channelId}).exec();
            let initEvent = {
                to: `BOT-${event.channelId}`,
                from: 'PANEL',
                type: 'PANEL_INIT',
                name: event.name,
                ts: Date.now()
            }
            initEvent.signature = hmacSHA1(toBot.sharedSecretKey, initEvent.to + initEvent.from + initEvent.ts);
            to.send(JSON.stringify(initEvent));

            ws.send(JSON.stringify({
                to: event.from,
                from: `BOT-${event.channelId}`,
                type: 'REGISTER_PANEL_SUCCESS',
                name: event.name,
                ts: Date.now()
            }));

            return;
        } else if (event.from === "PANEL" && event.type === "PING_SERVER") {
            console.log("PING SERVER: " + JSON.stringify(event, null, 5));
            let channelPanels = panels[event.channelId];
            let botWs = clients[`BOT-${event.channelId}`];
            if (!channelPanels) {
                return;
            }

            channelPanels.forEach((channelPanel) => {
                let newEvent = {
                    type: "PONG_SERVER",
                    to: event.from,
                    from: "SERVER",
                    ts: Date.now()
                };

                channelPanel.send(JSON.stringify(newEvent));
            });

            botWs.send(JSON.stringify({
                type: "PANEL_PING",
                to: `BOT-${event.channelId}`,
                from: "PANEL",
                name: event.name,
                ts: Date.now()
            }));
            return;
        }

        if (event.jwt) {
            let sharedSecret = defaultSecret;
            let hmacKey = key;

            // If from or to the bot, pull the shared key for the channel
            if (event.channelId) {
                let bot = await Bots.findOne({twitchChannelId: event.channelId}).exec();
                sharedSecret = bot.sharedSecretKey;
                hmacKey = bot.sharedSecretKey;

                console.log(`FOUND SHARED KEY ${sharedSecret} FOR BOT ${event.channelId}`);
            }

            jwt.verify(
                event.jwt,
                sharedSecret,
                async (err, decoded) => {
                    if (err) {
                        console.error('JWT Error', err);
                        return;
                    }

                    if (event.channelId && decoded.user_id != `BOT-${event.channelId}`) {
                        console.log('Bot id and jwt do not match');
                        return;
                    }


                    event.jwt = null;
                    event.from = decoded.user_id;
                    if (!event.from.startsWith("BOT-")) {
                        event.fromUser = await getTwitchUsername(event.from);
                    }
                    event.ts = Date.now();
                    event.signature = hmacSHA1(hmacKey, event.to + event.from + event.ts);

                    console.log("EVENT: " + JSON.stringify(event, null, 5));

                    if ((event.to && event.to.startsWith("BOT-") && !clients[event.to]) || (clients[event.to] && clients[event.to].readyState !== WebSocket.OPEN)) {
                        // console.error(`${event.to} IS NOT ACTIVE`);
                        if (!clients[event.from]) {
                            return;
                        }
                        clients[event.from].send(JSON.stringify({
                            type: "SEND_FAILURE"
                        }));
                        return;
                    }

                    if (event.type === "REGISTER") {
                        clients[decoded.user_id] = ws;
                    } else if (event.type === "PING_SERVER") {
                        let to = clients[decoded.user_id];
                        if (!to) {
                            return;
                        }
                        let newEvent = {
                            type: "PONG_SERVER",
                            to: event.from,
                            from: "SERVER",
                            ts: event.ts
                        };

                        newEvent.signature = hmacSHA1(hmacKey, newEvent.to + newEvent.from + newEvent.ts);
                        to.send(JSON.stringify(newEvent));
                    } else {
                        if (event.to === "PANELS") {
                            let channelPanels = panels[event.channelId];
                            if (!channelPanels) {
                                return;
                            }

                            channelPanels.forEach((channelPanel) => {
                                channelPanel.send(JSON.stringify(event));
                            })
                        } else if (event.to === "ALL") {
                            Object.keys(clients).forEach((key) => {
                                if (key !== event.from) {
                                    clients[key].send(JSON.stringify(event));
                                }
                            })
                        } else {
                            let to = clients[event.to];
                            if (!to) {
                                console.error("Cannot find client");
                                return;
                            }

                            if (event.to.startsWith("BOT-")) {
                                let toBot = await Bots.findOne({twitchChannelId: event.to.substring(4)}).exec();
                                event.signature = hmacSHA1(toBot.sharedSecretKey, event.to + event.from + event.ts);
                            }
                            to.send(JSON.stringify(event));
                        }
                    }
                }
            );
        }
    });
});

/*
 * Connect to database
*/

// Mongoose instance connection url connection
const databaseUrl = process.env.CBD_DB_URL;
mongoose.Promise = global.Promise;

var connectWithRetry = function() {
    return mongoose.connect(databaseUrl, function(err) {
        if (err) {
            console.warn('Failed to connect to mongo on startup - retrying in 5 sec');
            setTimeout(connectWithRetry, 5000);
        }
    });
};
connectWithRetry();