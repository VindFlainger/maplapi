const {Router} = require('express')
const Cart = require('../db/Cart')
const Sku = require('../db/Views/Sku')
const Location = require('../db/Location')
const Order = require('../db/Order')
const Product = require('../db/Product')
const {query, body} = require("express-validator");
const {validationHandler} = require("../utils/customValidation");
const {
    validateFieldIsRequired,
    commerceSkuNotExists,
    commerceSkuSizeNotExists,
    commerceSkuNotAvailable
} = require("../utils/errors");
const mongoose = require("mongoose");


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
            if (!sku) throw commerceSkuNotExists

            const size = sku.sizing.find(size => size.size === req.body.size)
            if (!size) throw commerceSkuSizeNotExists

            const items = await Cart.addItem(req.body.cartId, req.body.skuId, req.body.size, req.body.quantity)
            res.json(items)

        } catch (err) {
            next(err)
        }
    })

router.post('/initCart', async (req, res, next) => {
    try {
        const cartId = await Cart.initCart()
        res.json(cartId)
    } catch (err) {
        next(err)
    }
})

router.post('/mergeCarts',
    body(['aCartId', 'bCartId'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    body(['aCartId', 'bCartId'])
        .isLength({max: 200})
        .isString()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const items = await Cart.mergeCarts(req.body.aCartId, req.body.bCartId)

            res.json(items)
        } catch (err) {
            next(err)
        }
    })

router.post('/confirmOrder',
    body(['items', 'contactName', 'contactSurname', 'shippingLocation', 'shippingCity', 'shippingStreet', 'shippingHouse', 'shippingPostcode'])
        .notEmpty()
        .withMessage(validateFieldIsRequired)
    ,
    body('userId')
        .optional()
        .isMongoId()
    ,
    body('items')
        .isArray()
        .toArray()
    ,
    body('items.*.skuId')
        .isMongoId()
    ,
    body('items.*.quantity')
        .isInt({min: 1})
        .toInt()
    ,
    body('items.*.size')
        .isString()
    ,
    body(['contactName', 'contactSurname'])
        .isString()
        .isLength({max: 30})
    ,
    body(['shippingLocation', 'shippingCity', 'shippingStreet', 'shippingHouse'])
        .isString()
        .isLength({max: 30})
    ,
    body('shippingPostcode')
        .isPostalCode('BY')
    ,
    validationHandler,
    async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            await session.startTransaction()

            const items = await Promise.all(req.body.items.map(item => Sku.receiveSkuData(item.skuId, item.size, item.quantity)))
            if (items.some(item => !item)) throw commerceSkuNotAvailable

            const shippingPrice = await Location.getShippingPrice(req.body.shippingLocation)

            const formatItems = items.map(item => ({...item, sku: item.skuId, skuId: undefined}))

            const secret = await Order.$createOrder(
                {
                    owner: req.body.userId,
                    items: formatItems,
                    shippingPrice,
                    shippingLocation: req.body.shippingLocation,
                    shippingCity: req.body.shippingCity,
                    shippingStreet: req.body.shippingStreet,
                    shippingHouse: req.body.shippingHouse,
                    shippingPostcode: req.body.shippingPostcode,
                    contactName: req.body.contactName,
                    contactSurname: req.body.contactSurname,
                    cardNumber: '1821213102323213',
                    operation: 'afneiupg2q2ugy80fqweyf0qfwev834y8vcr3'
                },
                session
            )

            await Promise.all(items.map(item => Product.$decreaseSkuQuantity({
                skuId: item.skuId,
                size: item.size,
                quantity: item.quantity
            }, session)))

            await session.commitTransaction()

            res.json(secret)

        } catch (err) {
            await session.abortTransaction()
            next(err)
        } finally {
            await session.endSession()
        }
    }
)


module.exports = router
