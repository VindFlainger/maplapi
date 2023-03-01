const {Router} = require("express");
const User = require("../db/User");
const {successModified} = require("../utils/statuses");
const {body} = require("express-validator");
const {validationHandler} = require("../utils/customValidation");

const router = Router()

router.post('/customerRegistration',
    body('login')
        .isEmail(),
    body('password')
        .isStrongPassword({minNumbers: 0})
    ,
    body('name')
        .custom(v => /^[a-zа-я]+$/.test(v))
    ,
    validationHandler,
    async (req, res, next) => {
        try {
            await User.registration(req.body.login, req.body.password, req.body.role)
            res.json(successModified)
        } catch (err) {
            next(err)
        }
    })

router.post('/customerLogin',
    body(['login', 'password', 'device', 'ip'], )
    body('login')
        .isEmail()
    ,
    body('password')


    ,
    (req, res, next) => {
        try {
            User.generateRefreshToken()
        } catch (err) {
            next(err)
        }


    }
)

module.exports = router
