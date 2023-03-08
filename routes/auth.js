const {Router} = require("express");
const User = require("../db/User");
const {successModified} = require("../utils/statuses");
const {body} = require("express-validator");
const {validationHandler} = require("../utils/customValidation");
const {validateFieldIsRequired, authNotStrongPassword} = require("../utils/errors");

const router = Router()

router.post('/customerRegistration',
    body(['login', 'password', 'name', 'gender'], validateFieldIsRequired),
    body('login')
        .isEmail()
    ,
    body('password')
        .isStrongPassword({minNumbers: 0}).withMessage(authNotStrongPassword)
    ,
    body('name')
        .isLength({min: 3})
        .isString()
        .custom(v => /^[a-zа-я]+$/i.test(v))
    ,
    body('gender')
        .isIn(['male', 'female'])
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            await User.customerRegistration(req.body.login, req.body.password, req.body.name, req.body.gender)
            res.json(successModified)
        } catch (err) {
            next(err)
        }
    }
)

router.post('/login',
    body(['login', 'password', 'device', 'ip'], validateFieldIsRequired),
    body('login')
        .isEmail()
    ,
    body('password')
        .isLength({max: 50})
        .isString()
    ,
    body('device')
        .isLength({max: 200})
        .isString()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const keys = await User.generateRefreshToken(req.body.login, req.body.password, req.body.device, req.ip)
            res.cookie('access-token', keys.accessToken,
                {
                    expires: new Date(Date.now() + Number.parseInt(process.env.ACCESS_TOKEN_EXPIRES)),
                    httpOnly: true,
                    // TODO: production + secure: true
                })
            res.json(keys)
        } catch (err) {
            next(err)
        }
    }
)

router.post('/refresh',
    body(['refreshToken', 'device'], validateFieldIsRequired),
    body('refreshToken')
        .isLength({max: 1000})
        .isString()
    ,
    body('device')
        .isLength({max: 200})
        .isString()
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            const keys = await User.refreshToken(req.body.refreshToken, req.body.device, req.ip)
            res.cookie('access-token', keys.accessToken,
                {
                    expires: new Date(Date.now() + Number.parseInt(process.env.ACCESS_TOKEN_EXPIRES)),
                    httpOnly: true,
                    // TODO: production + secure: true
                })
            res.json(keys)
        } catch (err) {
            next(err)
        }
    }
)

module.exports = router
