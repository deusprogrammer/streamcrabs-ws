const express = require('express');
var router = express.Router();
var Monsters = require('../models/monsters');

router.route("/")
    .get((request, response) => {
        Monsters.find({}, null, {sort: {type: 1, rarity: 1, name: 1}}, (error, results) => {
            if (error) {
                return response.send(error);
            }

            return response.json(results);
        });
    });

router.route("/:id")
    .get((request, response) => {
        Monsters.findOne({id: request.params.id}, (error, results) => {
            if (error) {
                return response.send(error);
            }

            return response.json(results);
        });
    });

module.exports = router;