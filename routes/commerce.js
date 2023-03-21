const {Router} = require('express')
const Cart = require('../db/Cart')
const Sku = require('../db/Views/Sku')
const {query, body} = require("express-validator");
const {validationHandler} = require("../utils/customValidation");
const {validateFieldIsRequired, commerceNoSku, commerceNoSkuSize} = require("../utils/errors");

const router = new Router()

router.post('/delCartItem',
    body(['cartId', 'skuId', 'size'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    body('cartId')
        .isLength({max: 64})
    ,
    body('skuId')
        .isMongoId()
    ,
    body('size')
        .isString()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const items = await Cart.delItem(req.body.cartId, req.body.skuId, req.body.size)
            res.json(items)

        } catch (err) {
            next(err)
        }
    }
)

router.get('/getCartItems',
    query(['cartId'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
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

router.post('/addCartItem',
    body(['cartId', 'skuId', 'size'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    body('cartId')
        .isLength({max: 64})
    ,
    body('skuId')
        .isMongoId()
    ,
    body('size')
        .isString()
    ,
    body('quantity')
        .default(1)
        .isInt({min: 1})
        .toInt()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const sku = await Sku.findOne({_id: req.body.skuId})
            if (!sku) throw commerceNoSku

            const size = sku.sizing.find(size => size.size === req.body.size)
            if (!size) throw commerceNoSkuSize

            const items = await Cart.addItem(req.body.cartId, req.body.skuId, req.body.size, req.body.quantity)
            res.json(items)

        } catch (err) {
            next(err)
        }
    })


module.exports = router