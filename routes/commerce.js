const {Router} = require('express')
const Cart = require('../db/Cart')
const {query, body} = require("express-validator");
const {validationHandler} = require("../utils/customValidation");
const {validateFieldIsRequired} = require("../utils/errors");
const {successModified} = require("../utils/statuses");

const router = new Router()

router.post('/delCartItem',
    body(['cartId', 'skuId'], validateFieldIsRequired),
    body('cartId')
        .isLength({max: 64})
    ,
    body('skuId')
        .isMongoId()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            await Cart.delItem(req.body.cartId,req.body.skuId)

            res.json(successModified)

        } catch (err) {
            next(err)
        }
    }
)

router.get('/getCartItems',
    query(['cartId'], validateFieldIsRequired),
    query('cartId')
        .isLength({max: 64})
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const items = await Cart.getItems(req.query.cartId)
            res.json(items)

        } catch (err) {
            next(err)
        }
    }
)


module.exports = router