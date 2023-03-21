const {Router} = require('express')
const User = require('../../db/User')
const Product = require('../../db/Product')
const PaymentMethod = require('../../db/PaymentMethod')
const Review = require('../../db/Review')
const Location = require('../../db/Location')
const {query, body} = require("express-validator");
const {validationHandler} = require("../../utils/customValidation");
const {validateFieldIsRequired, interactingNoLocation} = require("../../utils/errors");
const {successModified} = require("../../utils/statuses");
const router = Router()

router.get('/shortData', async (req, res, next) => {
    try {
        const user = await User.getCustomerShortInfo(req.userId)
        res.json(user)
    } catch (err) {
        next(err)
    }
})

router.get('/getReviews',
    query('limit')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    query('offset')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const reviews = await Review.getUserReviews(req.userId, req.query.offset, req.query.limit)
            res.json(reviews)
        } catch (err) {
            next(err)
        }
    })

router.post('/setShipping',
    body(['location', 'city', 'street', 'house', 'postcode', 'fistName', 'lastName', 'phone'])
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

router.get('/getWishlist',
    query('limit')
        .optional()
        .isInt({max: 50, min: 0})
        .toInt()
    ,
    query('offset')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const {
                wishlist,
                totalCount,
                offset,
                limit,
                nextOffset
            } = await User.getWishlist(req.userId, req.query.offset, req.query.limit)

            const populatedWishlist = await Product.populateSkus(wishlist)

            res.json(
                {
                    wishlist: populatedWishlist,
                    totalCount,
                    offset,
                    limit,
                    nextOffset
                }
            )
        } catch (err) {
            next(err)
        }
    })

router.post('/addPaymentMethod',
    body(['number', 'expire'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    body('number')
        .isString()
        .custom(v => /^\d{16}$/.test(v))
    ,
    body('expire')
        .custom(v => /^(0[123456789]|11|12)\/\d{2}$/.test(v))
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            await PaymentMethod.addMethod(req.userId,
                {
                    number: req.body.number,
                    expire: req.body.expire,
                    isDefault: !!req.body.isDefault,
                }
            )

            res.json(successModified)
        } catch (err) {
            next(err)
        }
    })

router.post('/delPaymentMethod',
    body(['paymentId'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    body('paymentId')
        .isMongoId()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            await PaymentMethod.delMethod(req.userId, req.body.paymentId)

            res.json(successModified)
        } catch (err) {
            next(err)
        }
    })

router.post('/setDefaultPaymentMethod',
    body(['paymentId'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    body('paymentId')
        .isMongoId()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            await PaymentMethod.setDefault(req.userId, req.body.paymentId)

            res.json(successModified)
        } catch (err) {
            next(err)
        }
    })

router.get('/getPaymentMethods', async (req, res, next) => {
    try {
        const paymentMethods = await PaymentMethod.getMethods(req.userId)

        res.json(paymentMethods)
    } catch (err) {
        next(err)
    }
})


module.exports = router