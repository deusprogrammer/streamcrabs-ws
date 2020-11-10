var mongoose = require('mongoose')

var monsterSchema = new mongoose.Schema({
    id: {
        type: String,
        required: "Monsters must have an ID",
        unique: true
    },
    type: String,
    name: String,
    description: String,
    dungeon: {
        type: String,
        default: "GENERIC"
    },
    hp: Number,
    str: Number,
    dex: Number,
    int: Number,
    ac: Number,
    dmg: String,
    hit: Number,
    actions: {
        type: Array,
        of: {
            abilityId: String,
            chance: Number,
            condition: String
        }
    },
    drops: {
        type: Array,
        of: {
            itemId: String,
            chance: Number,
            onlyOne: Boolean,
            exclusive: {
                type: Boolean,
                default: false
            },
            exclusiveTaken: {
                type: Boolean,
                default: false
            }
        }
    },
    rarity: {
        type: Number,
        default: 1
    },
    owningChannel: {
        type: Number,
        required: "An owning channel is required",
        index: true
    }
});

module.exports = mongoose.model("monsters", monsterSchema);