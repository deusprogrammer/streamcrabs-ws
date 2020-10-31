var mongoose = require('mongoose')

var itemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: "Items must have an ID",
        unique: true
    },
    type: String,
    slot: String,
    name: String,
    description: String,
    use: String,
    dmg: String,
    dmgStat: {
        type: String,
        default: "HP"
    },
    toHitStat: {
        type: String,
        default: "HIT"
    },
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
    abilities: {
        type: Array,
        of: String,
        default: []
    },
    triggers: {
        type: Array,
        of: {
            abilityName: String,
            chance: Number
        },
        default: []
    },
    skills: {
        type: Array,
        of: {
            name: {type: String},
            level: {type: Number}
        },
        default: []
    },
    ac: Number,
    value: Number,
    rarity: {
        type: Number,
        default: 1
    }
})

module.exports = mongoose.model("items", itemSchema)

/**
 *  EXAMPLE
    {
        id: "LONG_SWORD",
        type: "weapon",
        slot: "hand",
        name: "Long Sword",
        dmg: "1d6",
        ac: 0,
        value: 100
    }
 */