const db = require('./index')
const sizedImage = require('./Schemas/sizedImage')

const {
    authUserAlreadyExists,
    authUserNotExists,
    authIncorrectPassword,
    authIncorrectRefreshToken
} = require("../utils/errors");
const bcrypt = require("bcrypt");
const crypto = require("crypto")
const jsonwebtoken = require("jsonwebtoken");

const sessionSchema = new db.Schema({
        fingerprint: {
            type: String,
            required: true,
            maxLength: 200
        },
        refreshToken: {
            type: String,
            required: true,
            maxLength: 200
        },
        expiresIn: {
            type: Date,
            required: true
        },
        ip: {
            type: String,
            required: true
        },
    },
    {
        _id: false,
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    })

const userSchema = new db.Schema({
        auth: {
            login: {
                type: String,
                required: true
            },
            password: {
                type: String,
                required: true
            },
            sessions: [sessionSchema]
        },
        role: {
            type: String,
            required: true,
            enum: ['vendor', 'customer', 'admin']
        },
        customerInfo: {
            type: {
                name: {
                    type: String,
                    required: true
                },
                gender: {
                    type: String,
                    required: true,
                    enum: ['male', 'female']
                },
                avatar: {
                    type: [sizedImage],
                    default: undefined
                },
                localization: {
                    language: {
                        type: String,
                        default: 'en',
                        enum: ['en', 'ru', 'by']
                    },
                    location: {
                        type: String,
                        default: 'minsk'
                    },
                    currency: {
                        type: String,
                        default: 'byn',
                        enum: ['byn', 'eur', 'usd']
                    }
                }
            },
            _id: false
        }
    }
)

userSchema.statics.checkUserExists = function (login) {
    return this.exists({'auth.login': login})
}

userSchema.statics.registration = async function (login, password, role) {
    const isUserExists = await this.checkUserExists(login)
    if (isUserExists) throw authUserAlreadyExists

    const hash = bcrypt.hashSync(password, 5)

    return await this.create({
        role,
        auth: {
            login,
            password: hash
        }
    })
}

userSchema.statics.customerRegistration = async function (login, password, name, gender) {
    const isUserExists = await this.checkUserExists(login)
    if (isUserExists) throw authUserAlreadyExists

    const hash = bcrypt.hashSync(password, 5)

    return await this.create({
        role: 'customer',
        auth: {
            login,
            password: hash
        },
        customerInfo: {
            name,
            gender
        }
    })
}


userSchema.statics.$getNewKeys = async function (login, id, device, ip, role) {
    await this.updateOne(
        {
            'auth.login': login
        },
        {
            $pull: {
                'auth.sessions': {
                    fingerprint: device
                }
            }
        }
    )

    const refreshToken = crypto.randomBytes(32).toString('hex')

    await this.updateOne(
        {
            'auth.login': login
        },
        {
            $push: {
                'auth.sessions': {
                    fingerprint: device,
                    ip,
                    expiresIn: new Date(Date.now() + Number.parseInt(process.env.REFRESH_TOKEN_EXPIRES)),
                    refreshToken
                }
            }
        }
    )

    const accessToken = jsonwebtoken.sign({
        role,
        login,
        id
    }, process.env.SECRET, {expiresIn: Number.parseInt(process.env.ACCESS_TOKEN_EXPIRES)})

    return {refreshToken, accessToken, expiresIn: Number.parseInt(process.env.ACCESS_TOKEN_EXPIRES)}
}

userSchema.statics.generateRefreshToken = async function (login, password, device, ip) {
    const user = await this.findOne({'auth.login': login})
    if (!user) throw authUserNotExists

    const isMatched = bcrypt.compareSync(password, user.auth.password)
    if (!isMatched) throw authIncorrectPassword

    return await this.$getNewKeys(login, user._id, device, ip, user.role)
}

userSchema.statics.refreshToken = async function (refreshToken, device, ip) {
    const user = await this.findOne({'auth.sessions.refreshToken': refreshToken})
    if (!user) throw authIncorrectRefreshToken

    return await this.$getNewKeys(user.auth.login, user._id, device, ip, user.role)
}

userSchema.statics.getCustomerShortInfo = async function (userId) {
    return await
        this.findById(userId)
            .select({
                    'auth.login': 1,
                    'customerInfo.name': 1,
                    'customerInfo.gender': 1,
                    'customerInfo.localization': 1,
                    'customerInfo.avatar': 1,
                }
            )
}


module.exports = db.model('user', userSchema, 'users')