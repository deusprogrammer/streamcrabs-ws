const express = require('express');
var router = express.Router();
var Jobs = require('../models/jobs');

router.route("/")
    .get((request, response) => {
        Jobs.find({}, null, {sort: {type: 1, slot: 1, name: 1}}, (error, results) => {
            if (error) {
                return response.send(error);
            }

            return response.json(results);
        });
    });

router.route("/:id")
    .get((request, response) => {
        Jobs.findOne({id: request.params.id}, (error, results) => {
            if (error) {
                return response.send(error);
            }

            return response.json(results);
        });
    });

module.exports = router;