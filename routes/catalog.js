const {Router} = require('express')
const Category = require('../db/Category')
const Product = require('../db/Product')
const {query, body} = require("express-validator");
const {validateFieldIsRequired} = require("../utils/errors");
const {validationHandler} = require("../utils/customValidation");

const router = Router()

router.get('/getCategories', async (req, res, next) => {
        try {
            const categories = await Category.getTree()
            res.json(categories)
        } catch (err) {
            next(err)
        }
    }
)

router.post('/getProducts',
    body(['target', validateFieldIsRequired]),
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
    body('target')
        .isString()
    ,
    body(['category_1', 'category_2', 'category_3', 'color'])
        .optional()
        .isString()
    ,
    body('minPrice')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    body('maxPrice')
        .optional()
        .isInt({min: 0})
        .toInt()
    ,
    body('sizes')
        .optional()
        .isArray({max: 20})
        .toArray()
    ,
    body('details')
        .optional()
        .isArray({max: 20})
        .toArray()
    ,
    body('details.*')
        .isObject()
    ,
    body('details.*.name')
        .isString()
    ,
    body('details.*.value')
        .isArray()
        .toArray()
    ,
    body('details.*.value.*')
        .isString()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const products = await Product.getProducts(
                req.body.offset,
                req.body.limit,
                {
                    target: req.body.target,
                    category_1: req.body.category_1,
                    category_2: req.body.category_2,
                    category_3: req.body.category_3,
                    color: req.body.color,
                    minPrice: req.body.minPrice,
                    maxPrice: req.body.maxPrice,
                    sizes: req.body.sizes,
                    details: req.body.details
                }
            )
            res.json(products)
        } catch (err) {
            next(err)
        }

    }
)


router.get('/getProductInfo',
    query(['productId', validateFieldIsRequired]),
    query('productId')
        .isMongoId()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const categories = await Product.getProductInfo(req.query.productId)
            res.json(categories)
        } catch (err) {
            next(err)
        }
    }
)


/*router.get('/test', async (req, res, next) => {
    const session = await db.startSession()
    session.startTransaction()
    await Product.updateOne({'skus.color': 'red'}, {$inc: {'skus.$.pricing.price': 1}}).session(session)
    await session.abortTransaction()
    await session.endSession()
})*/

module.exports = router
