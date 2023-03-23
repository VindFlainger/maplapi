const {Router} = require('express')
const {body} = require("express-validator");
const {validateFieldIsRequired, interactingNoLocation} = require("../../utils/errors");
const {validationHandler} = require("../../utils/customValidation");
const Location = require("../../db/Location");
const User = require("../../db/User");
const {successModified} = require("../../utils/statuses");

const router = Router()

router.post('/setShipping',
    body(['location', 'city', 'street', 'house', 'postcode', 'firstName', 'lastName', 'phone'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    body('firstName')
        .isString()
        .isLength({max: 30})
    ,
    body('lastName')
        .isString()
        .isLength({max: 30})
    ,
    body('phone')
        .trim('+')
        .isMobilePhone('be-BY')
    ,
    body('postcode')
        .isPostalCode('BY')
    ,
    body(['location', 'city', 'street', 'house', 'postcode'])
        .isString()
        .isLength({max: 30})
    ,
    body('location')
        .toLowerCase()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const locationExists = await Location.isExists(req.body.location)
            if (!locationExists) throw interactingNoLocation

            User.setShippingInformation(req.userId, {
                location: req.body.location,
                city: req.body.city,
                street: req.body.street,
                house: req.body.house,
                postcode: req.body.postcode,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phone: req.body.phone,
            })

            res.json(successModified)

        } catch (err) {
            next(err)
        }
    }
)

router.get('/getShipping', async (req, res, next) => {
    try {
        const address = await User.getShippingInformation(req.userId)
        res.json(address)
    } catch (err) {
        next(err)
    }
})

module.exports = router