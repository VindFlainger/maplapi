const db = require('./index')
const {authUserAlreadyExists, authUserNotExists, authIncorrectPassword} = require("../utils/errors");
const bcrypt = require("bcrypt");

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
            localization: {
                language: {
                    type: String,
                    default: 'en'
                },
                location: {
                    type: String,
                    default: 'Minsk'
                }
            }
        },
    },
    vendorInfo: {
        type: {},
    }
})

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
            password: hash,
        }
    })
}

userSchema.statics.generateRefreshToken = async function (login, password, device, ip) {
    const user = await this.findOne({'auth.login': 'login'})
    if (!user) throw authUserNotExists

    const isMatched = bcrypt.compareSync(password, user.auth.password)
    if (!isMatched) throw authIncorrectPassword

    await this.updateOne(
        {
            'auth.login': login
        },
        {
            'auth.login': {
                $pull: {
                    'fingerprint': device
                }
            }
        }
    )

    const refreshToken = bcrypt.genSaltSync()

    await this.updateOne(
        {
            'auth.login': login
        },
        {
            'auth.login': {
                $push: {
                    fingerprint: device,
                    ip,
                    expiresIn: new Date(Date.now() + 1000 * 60 * 15),
                    refreshToken
                }
            }
        }
    )
}

module.exports = db.model('user', userSchema, 'users')