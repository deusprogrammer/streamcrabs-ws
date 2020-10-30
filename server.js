import express from 'express';
import mongoose from 'mongoose';
import bodyparser from 'body-parser';
import cors from 'cors';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const WebSocket = require('ws');

const usersRoutes = require('./api/routes/users');
const itemRoutes = require('./api/routes/items');
const jobRoutes = require('./api/routes/jobs');
const monsterRoutes = require('./api/routes/monsters');
const abilityRoutes = require('./api/routes/abilities');

// Keys for jwt verification
const key = process.env.TWITCH_SHARED_SECRET;
const secret = Buffer.from(key, 'base64');

// Setup websocket server for communicating with the panel
const wss = new WebSocket.Server({ port: 8082 });
const clients = {};

const hmacSHA1 = (key, data) => {
    return crypto.createHmac('sha1', key).update(data).digest().toString('base64');
}

// Set up a websocket routing system
wss.on('connection', async (ws) => {
    console.log("CONNECTION");
    ws.on('message', (message) => {
        let event = JSON.parse(message);
        console.log("MESSAGE: " + JSON.stringify(event, null, 5));
        if (event.jwt) {
            jwt.verify(
                event.jwt,
                secret,
                (err, decoded) => {
                    if (err) {
                        console.error('JWT Error', err);
                        return;
                    }

                    event.jwt = null;
                    event.from = decoded.user_id;
                    event.ts = Date.now();
                    event.signature = hmacSHA1(key, event.to + event.from + event.ts);

                    if ((event.to && event.to.startsWith("BOT-") && !clients[event.to]) || (clients[event.to] && clients[event.to].readyState !== WebSocket.OPEN)) {
                        console.error(`${event.to} IS NOT ACTIVE`);
                        clients[event.from].send(JSON.stringify({
                            type: "SEND_FAILURE"
                        }));
                        return;
                    }

                    if (event.type === "REGISTER") {
                        console.log(`USER ${decoded.user_id} REGISTERED`);
                        clients[decoded.user_id] = ws;
                    } else if (event.type === "PING_SERVER") {
                        console.log(`USER ${decoded.user_id} PING_SERVER`);
                        let to = clients[decoded.user_id];
                        if (!to) {
                            return;
                        }
                        let newEvent = {
                            type: "PONG_SERVER",
                            to: event.from,
                            from: "SERVER",
                            ts: Date.now()
                        };
                        event.signature = hmacSHA1(key, newEvent.to + newEvent.from + newEvent.ts);
                        to.send(JSON.stringify(newEvent));
                    } else {
                        if (event.to === "ALL") {
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
                            to.send(JSON.stringify(event));
                        }
                    }
                }
            );
        }
    });
});

let app = express();
let port = process.env.PORT || 8081;

// Mongoose instance connection url connection
const databaseUrl = process.env.CBD_DB_URL;
mongoose.Promise = global.Promise;

/*
 * Connect to database
*/

var connectWithRetry = function() {
    return mongoose.connect(databaseUrl, function(err) {
        if (err) {
            console.warn('Failed to connect to mongo on startup - retrying in 5 sec');
            setTimeout(connectWithRetry, 5000);
        }
    });
};
connectWithRetry();

app.use(bodyparser.json());
app.use(cors());

app
    .use('/:route?', (req, res, next) => {
        if (req.headers['authorization']) {
            console.log("AUTH :   " + req.headers['authorization']);
            let [ type, auth ] = req.headers['authorization'].split(' ');
            if (type == 'Bearer') {
                jwt.verify(
                    auth,
                    secret,
                    (err, decoded) => {
                        if (err) {
                            console.log('JWT Error', err);

                            res.status('401').json({error: true, message: 'Invalid authorization'});
                            return;
                        }

                        req.extension = decoded;

                        console.log('Extension Data:', req.extension);

                        next();
                    }
                );

                return;
            }

            res.status('401').json({error: true, message: 'Invalid authorization header'});
        } else {
            res.status('401').json({error: true, message: 'Missing authorization header'});
        }
    });

/*
 * Routes 
 */
app.use('/users', usersRoutes);
app.use('/items', itemRoutes);
app.use('/jobs', jobRoutes);
app.use('/monsters', monsterRoutes);
app.use('/abilities', abilityRoutes);

app.listen(port);
console.log('chat-battle-dungeon RESTful API server started on: ' + port);