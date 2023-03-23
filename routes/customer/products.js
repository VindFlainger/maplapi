const {Router} = require('express')
const {body, query} = require("express-validator");
const {validateFieldIsRequired, interactingNoSku} = require("../../utils/errors");
const {validationHandler} = require("../../utils/customValidation");
const Product = require("../../db/Product");
const User = require("../../db/User");
const {successModified} = require("../../utils/statuses");
const mongoose = require("mongoose");
const Order = require("../../db/Order");

const router = Router()

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

            res.json(
                {
                    wishlist,
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
    body('limit')
        .default(30)
        .isInt({max: 30, min: 5})
        .toInt()
    ,
    body('offset')
        .default(0)
        .isInt({min: 0})
        .toInt()
    ,
    async (req, res, next) => {
        try {
            const orders = await Order.getUserOrders(req.userId, req.body.offset, req.body.limit)
            res.json(orders)
        } catch (err) {
            next(err)
        }
    })

module.exports = router