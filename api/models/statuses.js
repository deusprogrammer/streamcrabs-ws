var mongoose = require('mongoose')

var statusSchema = new mongoose.Schema({
    id: {
        type: String,
        required: "Statuses must have an ID",
        unique: true
    },
    name: String,
    description: String,
    dmg: String,
    procTime: {
        type: Number,
        default: 0
    },
    maxProcs: {
        type: Number,
        default: 1
    },
    dmgStat: {
        type: String,
        default: "HP"
    },
    element: String,
    otherEffects: String,
    otherEffectsDuration: Number,
    owningChannel: {
        type: Number,
        required: "An owning channel is required",
        index: true
    }
})

module.exports = mongoose.model("statuses", statusSchema)