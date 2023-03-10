const {Router} = require('express')
const jwt = require("jsonwebtoken");
const {authAccessTokenExpires, authIncorrectAccessToken, authNotCustomerSession} = require("../../utils/errors");
const account = require('./account')
const reviews = require('./reviews')
const order = require('./order')

const router = Router()

router.use((req, res, next) => {
    jwt.verify(req.cookies['access-token'] || req.body.accessToken, process.env.SECRET, (err, payload) => {
        if (err) {
            switch (err) {
                case jwt.TokenExpiredError:
                    return next(authAccessTokenExpires)
                default:
                    next(authIncorrectAccessToken)
            }
            return
        }
        if (payload.role !== 'customer') return next(authNotCustomerSession)
        req.login = payload.login
        req.userId = payload.id
        next()
    })
})

router.use('/account', account)
router.use('/reviews', reviews)
router.use('/order', order)


module.exports = router