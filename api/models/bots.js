var mongoose = require('mongoose')

var botSchema = new mongoose.Schema({
    twitchChannel: {
        type: String,
        required: 'Channel name is required',
        unique: true
    },
    twitchChannelId: {
        type: Number,
        required: 'Channel id is required',
        unique: true
    },
    twitchOwnerUserId: {
        type: Number,
        required: 'Twitch owner id is required',
        unique: true
    },
    sharedSecretKey: {
        type: String,
        required: 'Shared secret key is required'
    },
    accessToken: {
        type: String
    },
    refreshToken: {
        type: String
    },
    priority: {
        type: Number,
        default: 0
    },
    config: {
        type: Map,
        default: {
            "cbd": true,
            "requests": true
        }
    },
    videoPool: {
        type: Array,
        of: {
            url: String,
            name: String
        },
        default: []
    },
    audioPool: {
        type: Array,
        of: {
            url: String,
            name: String
        },
        default: []
    }
})

module.exports = mongoose.model("bots", botSchema)