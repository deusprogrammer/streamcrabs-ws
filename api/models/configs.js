var mongoose = require('mongoose')

var configSchema = new mongoose.Schema({
    name: {
        type: String,
        required: "Configs must have a name",
        unique: true
    },
    values: {
        type: Array,
        of: String
    }
})

module.exports = mongoose.model("configs", configSchema)