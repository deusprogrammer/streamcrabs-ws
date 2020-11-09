var mongoose = require('mongoose')

var botSchema = new mongoose.Schema({
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
})

module.exports = mongoose.model("bots", botSchema)