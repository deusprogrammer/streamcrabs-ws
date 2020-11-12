import axios from 'axios';
const express = require('express');
var router = express.Router();

var Bots = require('../models/bots');

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const BATTLE_BOT_JWT = process.env.BATTLE_BOT_JWT;
const redirectUrl = "https://deusprogrammer.com/util/twitch/registration/callback";

const randomUuid = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const getAccessToken = async (code) => {
    try {
        let res = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUrl}`);

        return res.data;
    } catch (error) {
        console.error("Call to get access token failed! " + error.message);
    }
}

const getProfile = async (accessToken) => {
    try {
        let res = await axios.get(`https://api.twitch.tv/helix/users`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Client-Id": clientId
            }
        });
    } catch (error) {
        console.error("Call to get profile failed! " + error.message);
    }

    return res.data;
}

const createTrinaryUser = async (username, userId) => {
    // Create a user for profile service so the main UI page can be accessed
    try {
        await axios.post(`http://10.0.0.243:8090/users`, {
            username,
            password: randomUuid(),
            connected: {
                twitch: {
                    userId: userId.toString(),
                    name: username,
                    channels: [
                        userId.toString()
                    ]
                }
            },
            roles: ["SUPER_USER"]
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
}

router.route("/")
    .post(async (request, response) => {
        // Get access token.
        let accessTokenRes = await getAccessToken(request.body.twitchAuthCode);

        // Get user profile.
        let userRes = await getProfile(accessTokenRes.access_token);

        // Create user.
        await createTrinaryUser(userRes.login, userRes.id);

        try {
            request.body.sharedSecretKey = randomUuid();
            request.body.twitchChannelId = twitchUser;
            request.body.twitchOwnerUserId = twitchUser;
            request.body.accessToken = accessTokenRes.access_token;
            request.body.refreshToken = accessTokenRes.refresh_token;
            
            let bot = await Bots.create(request.body);
            return response.json(bot);
        } catch (error) {
            console.error(error);
            response.status(500);
            return response.send(error);
        }
    })

module.exports = router;