var mongoose = require('mongoose')

var encounterSchema = new mongoose.Schema({
    id: {
        type: String,
        required: "Encounters must have an ID",
        unique: true
    },
    mobs: {
        type: Array,
        of: String
    },
    spawnTime: Date
})

module.exports = mongoose.model("encounters", encounterSchema)