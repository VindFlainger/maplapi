const {Router} = require('express')
const {body, query} = require("express-validator");
const {validateFieldIsRequired, interactingNoProduct, interactingNoSku} = require("../../utils/errors");
const {validationHandler} = require("../../utils/customValidation");
const Product = require("../../db/Product");
const User = require("../../db/User");
const Order = require("../../db/Order");
const {successModified} = require("../../utils/statuses");
const mongoose = require("mongoose");

const router = Router()

router.post('/addToWishlist',
    body(['skuId', validateFieldIsRequired]),
    body('skuId')
        .isMongoId()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const sku = await Product.findOne({"skus._id": new mongoose.Types.ObjectId(req.body.skuId)})
            if (!sku) throw interactingNoSku

            await User.addSkuToWishlist(req.userId, req.body.skuId)

            res.json(successModified)
        } catch (err) {
            next(err)
        }
    })

router.post('/delFromWishlist',
    body(['skuId', validateFieldIsRequired]),
    body('skuId')
        .isMongoId()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            await User.delSkuFromWishlist(req.userId, req.body.skuId)

            res.json(successModified)
        } catch (err) {
            next(err)
        }
    })

router.get('/getOrders',
    query('offset')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    query('limit')
        .optional()
        .isInt({min: 0, max: 50})
        .toInt()
    ,
    validationHandler,
    async (req, res, next) => {
    try {
        const orders = await Order.getOrders(req.userId, req.query.offset, req.query.limit)

        res.json(orders)
    } catch (err) {
        next(err)
    }
})

module.exports = router