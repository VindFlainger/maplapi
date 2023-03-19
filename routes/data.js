const {Router} = require('express')
const {query} = require("express-validator");
const {validationHandler} = require("../utils/customValidation");
const Location = require('../db/Location')

const router = Router()

router.get('/getLocations',
    query('language')
        .optional()
        .isIn(['en', 'ru'])
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const locations = await Location.getAvailableLocations(req.query.language)
            res.json(locations)
        } catch (err) {
            next(err)
        }
    })


module.exports = router