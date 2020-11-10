var mongoose = require('mongoose')

var abilitySchema = new mongoose.Schema({
    id: {
        type: String,
        required: "Abilities must have an ID",
        unique: true
    },
    name: String,
    description: String,
    ap: {
        type: Number,
        default: 1
    },
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
    toHitStat: {
        type: String,
        default: "HIT"
    },
    ignoreDamageMods: {
        type: Boolean,
        default: false
    },
    target: String,
    area: String,
    element: String,
    mods: {
        hp: {
            type: Number,
            default: 0
        },
        hit: {
            type: Number,
            default: 0
        },
        str: {
            type: Number,
            default: 0
        },
        dex: {
            type: Number,
            default: 0
        },
        int: {
            type: Number,
            default: 0
        },
        ac: {
            type: Number,
            default: 0
        }
    },
    triggers: {
        type: Array,
        of: {
            abilityName: String,
            chance: Number
        },
        default: []
    },
    buffs: String,
    buffsDuration: Number,
    owningChannel: {
        type: Number,
        required: "An owning channel is required",
        index: true
    }
})

module.exports = mongoose.model("abilities", abilitySchema)