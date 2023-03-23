const {Router} = require("express");
const {body} = require("express-validator");
const {validateFieldIsRequired} = require("../../utils/errors");
const {validationHandler} = require("../../utils/customValidation");
const PaymentMethod = require("../../db/PaymentMethod");
const {successModified} = require("../../utils/statuses");
const router = Router()


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
            const data = await PaymentMethod.addMethod(req.userId,
                {
                    number: req.body.number,
                    expire: req.body.expire,
                    isDefault: !!req.body.isDefault,
                }
            )

            res.json(data)
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