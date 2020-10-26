import express from 'express';
import mongoose from 'mongoose';
import bodyparser from 'body-parser';
import cors from 'cors';

const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

var usersRoutes = require('./api/routes/users');
var itemRoutes = require('./api/routes/items');
var jobRoutes = require('./api/routes/jobs');
var monsterRoutes = require('./api/routes/monsters');
var abilityRoutes = require('./api/routes/abilities');

// Setup websocket server for communicating with the panel
const wss = new WebSocket.Server({ port: 8082 });

wss.on('connection', (ws) => {
    let initEvent = {
        type: "INIT",
        eventData: {
            results: {},
            encounterTable
        }
    }
    ws.send(JSON.stringify(initEvent, null, 5));
});

wss.on('message', () => {
    console.log("FART");
});

let app = express();
let port = process.env.PORT || 8081;

// Mongoose instance connection url connection
const databaseUrl = process.env.CBD_DB_URL;
const key = process.env.TWITCH_SHARED_SECRET;
const secret = Buffer.from(key, 'base64');
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