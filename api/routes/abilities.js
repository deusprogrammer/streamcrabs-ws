const express = require('express');
var router = express.Router();
var Abilities = require('../models/abilities');

router.route("/")
    .get((request, response) => {
        Abilities.find({}, null, {sort: {element: 1, target: 1, area: 1, ap: 1, name: 1}}, (error, results) => {
            if (error) {
                return response.send(error);
            }

            return response.json(results);
        });
    });

router.route("/:id")
    .get((request, response) => {
        Abilities.findOne({id: request.params.id}, (error, results) => {
            if (error) {
                return response.send(error);
            }

            return response.json(results);
        });
    });

module.exports = router;