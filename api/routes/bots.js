import axios from 'axios';
const express = require('express');
var router = express.Router();

var Bots = require('../models/bots');

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const BATTLE_BOT_JWT = process.env.BATTLE_BOT_JWT;
const TWITCH_EXT_CLIENT_ID = process.env.TWITCH_EXT_CLIENT_ID;
const TWITCH_BOT_CLIENT_ID = process.env.TWITCH_BOT_CLIENT_ID;
const TWITCH_BOT_USER = process.env.TWITCH_BOT_USER;
const TWITCH_BOT_PASS = process.env.TWITCH_BOT_PASS;
const TWITCH_BOT_ACCESS_TOKEN = process.env.TWITCH_BOT_ACCESS_TOKEN;
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
        throw error;
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

        return res.data;
    } catch (error) {
        console.error("Call to get profile failed! " + error.message);
        throw error;
    }
}

const createBotContainer = async (userId) => {
    const url = `http://10.0.0.243:2375/containers/create?name=cbd-bot-${userId}`;
    let res = await axios.post(url, {
        Image: "mmain/cbd-bot:latest",
        Env: [
            `TWITCH_EXT_CHANNEL_ID=${userId}`,
            `TWITCH_EXT_CLIENT_ID=${TWITCH_EXT_CLIENT_ID}`,
            `TWITCH_BOT_ACCESS_TOKEN=${TWITCH_BOT_ACCESS_TOKEN}`,
            `TWITCH_BOT_USER=${TWITCH_BOT_USER}`,
            `TWITCH_BOT_PASS=${TWITCH_BOT_PASS}`,
            `TWITCH_BOT_CLIENT_ID=${TWITCH_BOT_CLIENT_ID}`,
            "PROFILE_API_URL=https://deusprogrammer.com/api/profile-svc",
            "BATTLE_API_URL=https://deusprogrammer.com/api/twitch"
        ]
    });

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
            roles: []
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
        try {
            // Get access token.
            let accessTokenRes = await getAccessToken(request.body.twitchAuthCode);

            // Get user profile.
            let userRes = await getProfile(accessTokenRes.access_token);

            // Create user.
            let profile = userRes.data[0];
            await createTrinaryUser(profile.login, profile.id);

            // Create bot container
            await createBotContainer(profile.id);

            // Create body
            request.body.sharedSecretKey = randomUuid();
            request.body.twitchChannel = profile.login;
            request.body.twitchChannelId = parseInt(profile.id);
            request.body.twitchOwnerUserId = parseInt(profile.id);
            request.body.accessToken = accessTokenRes.access_token;
            request.body.refreshToken = accessTokenRes.refresh_token;
            
            // Save body
            let bot = await Bots.create(request.body);
            return response.json(bot);
        } catch (error) {
            console.error(error);
            response.status(500);
            return response.send(error);
        }
    })

module.exports = router;