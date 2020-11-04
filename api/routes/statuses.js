const express = require('express');
var router = express.Router();
var Statuses = require('../models/statuses');

router.route("/")
    .get((request, response) => {
        Statuses.find({}, null, {sort: {element: 1, name: 1}}, (error, results) => {
            if (error) {
                return response.send(error);
            }

            return response.json(results);
        });
    });

router.route("/:id")
    .get((request, response) => {
        Statuses.findOne({id: request.params.id}, (error, results) => {
            if (error) {
                return response.send(error);
            }

            return response.json(results);
        });
    });

module.exports = router;