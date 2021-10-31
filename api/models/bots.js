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
    raidTheme: {
        type: String,
        default: "YOSHI"
    },
    config: {
        type: Map,
        default: {
            "cbd": true,
            "requests": false,
            "raid": false,
            "rewards": false
        }
    },
    videoPool: {
        type: Array,
        of: {
            url: String,
            name: String,
            volume: {
                type: Number,
                default: 1.0
            },
            x: {
                type: String,
                default: "0px"
            },
            y: {
                type: String,
                default: "0px"
            },
            width: {
                type: String,
                default: "100vw"
            },
            height: {
                type: String,
                default: "100vh"
            }
        },
        default: []
    },
    audioPool: {
        type: Array,
        of: {
            url: String,
            name: String,
            volume: {
                type: Number,
                default: 1.0
            },
            x: {
                type: String,
                default: "0px"
            },
            y: {
                type: String,
                default: "0px"
            },
            width: {
                type: String,
                default: "100vw"
            },
            height: {
                type: String,
                default: "100vh"
            }
        },
        default: []
    }
})

module.exports = mongoose.model("bots", botSchema)