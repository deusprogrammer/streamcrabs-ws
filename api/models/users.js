var mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
    id: String,
    name: {
        type: String,
        required: "Name is required",
        unique: true
    },
    currentJob: {
        id: String
    },
    ap: Number,
    hp: Number,
    equipment: {
        hand: {
            id: String
        },
        offhand: {
            id: String
        },
        head: {
            id: String
        },
        body: {
            id: String
        },
        arms: {
            id: String
        },
        legs: {
            id: String
        },
        accessory: {
            id: String
        }
    },
    inventory: {
        type: Array,
        of: String
    },
    gold: Number
});

module.exports = mongoose.model("users", userSchema);

/**
 * EXAMPLE
{
    id: "88666502",
    name: "thetruekingofspace",
    currentJob: {
        id: "SQUIRE"
    },
    ap: 2,
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
        "41441", 
        "1234", 
        "5678", 
        "34411", 
        "14515",
        "1212",
        "45354"
    ],
    gold: 100
}
**/