import express from 'express';
import mongoose from 'mongoose';
import bodyparser from 'body-parser';
import cors from 'cors';
import e from 'express';

const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

var usersRoutes = require('./api/routes/users');
var itemRoutes = require('./api/routes/items');
var jobRoutes = require('./api/routes/jobs');
var monsterRoutes = require('./api/routes/monsters');
var abilityRoutes = require('./api/routes/abilities');

// Keys for jwt verification
const key = process.env.TWITCH_SHARED_SECRET;
const secret = Buffer.from(key, 'base64');

// Setup websocket server for communicating with the panel
const wss = new WebSocket.Server({ port: 8082 });
const clients = {};

// Set up a websocket routing system
wss.on('connection', (ws) => {
    console.log("CONNECTION");
    ws.on('message', (message) => {
        let event = JSON.parse(message);
        console.log("MESSAGE: " + JSON.stringify(event, null, 5));
        if (event.jwt) {
            jwt.verify(
                auth,
                secret,
                (err, decoded) => {
                    if (err) {
                        console.log('JWT Error', err);
                        return;
                    }

                    event.jwt = null;

                    if (event.type === "REGISTER") {
                        clients[decoded.user_id] = ws;
                    } else {
                        if (event.to === "ALL") {
                            Object.keys(clients).forEach((key) => {
                                clients[key].send(JSON.stringify(event));
                            })
                        } else {
                            let to = clients[event.to];
                            to.send(JSON.stringify(event));
                        }
                    }
                }
            );
    
            return;
        }
        clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
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