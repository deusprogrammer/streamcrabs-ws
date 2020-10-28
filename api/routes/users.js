import express from 'express'; 
import axios from 'axios';
var router = express.Router();

import Users from '../models/users';
import Items from '../models/items';
import {getAuthenticatedTwitchUserName} from '../utils/SecurityHelper';

const BATTLE_BOT_JWT = process.env.BATTLE_BOT_JWT;

const randomUuid = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

router.route("/")
    .get(async (request, response) => {
        try {
            let results = await Users.find({}, null, {sort: {name: 1}}).exec();
            return response.json(results);
        } catch (e) {
            console.error("ERROR IN GET ALL: " + e.stack);
            response.status(500);
            return response.send(e);
        }
    })
    .post(async (request, response) => {
        try {
            let userId = getAuthenticatedTwitchUserName(request);
            let username = request.body.name;

            // Create a user for profile service so the main UI page can be accessed
            try {
                await axios.post(`http://10.0.0.243:8090/users`, {
                    username: username,
                    password: randomUuid(),
                    connected: {
                        twitch: {
                            userId: userId,
                            name: username
                        }
                    }
                }, {
                    headers: {
                        contentType: "application/json",
                        Authorization: `Bearer ${BATTLE_BOT_JWT}`
                    }
                });
            } catch (error) {
                if (error.response && error.response.status !== 409) {
                    throw error;
                }
            }

            let user = {
                id: userId,
                name: username,
                currentJob: {
                    id: "SQUIRE"
                },
                ap: 2,
                hp: 100,
                mp: 10,
                equipment: {
                    hand: {
                        id: "LONG_SWORD"
                    },
                    offhand: {},
                    head: {
                        id: "LEATHER_CAP"
                    },
                    body: {
                        id: "LEATHER_CURIASS"
                    },
                    arms: {
                        id: "LEATHER_GAUNTLETS"
                    },
                    legs: {
                        id: "LEATHER_PANTS"
                    }
                }, inventory: [
                    "POTION",
                    "POTION"
                ],
                gold: 100
            };

            let results = await Users.create(user);
            return response.json(results);
        } catch (e) {
            console.error("ERROR IN CREATE: " + e.stack);
            response.status(500);
            return response.send(e);
        }
    });

router.route("/:id")
    .get(async (request, response) => {
        let userId = request.params.id;
        let twitchUser = getAuthenticatedTwitchUserName(request);
        
        if (twitchUser !== userId) {
            response.status(403);
            return response.send("Insufficient privileges");
        }

        try {
            let results = await Users.findOne({id: userId}).exec();
            return response.json(results);
        } catch (e) {
            console.error("ERROR IN GET ONE: " + e);
            response.status(500);
            return response.send(e);
        }
    })
    .put(async (request, response) => {
        let twitchUser = getAuthenticatedTwitchUserName(request);
        if (twitchUser !== request.params.id) {
            response.status(403);
            return response.send("Insufficient privileges");
        }

        let newUser = request.body;

        try {
            let oldUser = await Users.findOne({id: request.params.id}).exec();

            // Revert most fields to whatever is in the database.
            newUser.id   = oldUser.id;
            newUser.name = oldUser.name;
            newUser.ap   = oldUser.ap;
            newUser.hp   = oldUser.hp;

            // Check equipment/inventory changes to make sure that equipment is in inventory first.
            let oldInventory = Object.keys(oldUser.equipment)
            .filter((slot) => {
                return oldUser.equipment[slot] && oldUser.equipment[slot].id;
            })
            .map((slot) => {
                return oldUser.equipment[slot].id;
            });
            oldInventory = [...oldInventory, ...oldUser.inventory];

            let newInventory = Object.keys(newUser.equipment)
            .filter((slot) => {
                return newUser.equipment[slot] && newUser.equipment[slot].id;
            })
            .map((slot) => {
                return newUser.equipment[slot].id;
            });
            newInventory = [...newInventory, ...newUser.inventory];

            newInventory.forEach((item) => {
                if (!oldInventory.includes(item)) {
                    response.status(400);
                    return response.send("You nasty cheater.");
                }
            });

            // Need item table for next check
            let items = await Items.find({}, null, {sort: {type: 1, slot: 1, name: 1}}).exec();

            var itemTable = {};
            items.forEach((item) => {
                itemTable[item.id] = item;
            })

            // Check that gold value is balanced.
            let oldInventoryValue = oldInventory.reduce((prev, curr) => {
                return prev + itemTable[curr].value;
            }, 0) + oldUser.gold;
            let newInventoryValue = newInventory.reduce((prev, curr) => {
                return prev + itemTable[curr].value;
            }, 0) + newUser.gold;

            if (oldInventoryValue !== newInventoryValue) {
                response.status(400);
                return response.send("You nasty cheater.");
            }

            let results = await Users.updateOne({name: request.params.id}, newUser).exec();

            return response.json(results);
        } catch (e) {
            console.error("ERROR IN UPDATE: " + e.stack);
            response.status(500);
            return response.send(e);
        }
    });

module.exports = router;