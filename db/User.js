const db = require('./index')
const sizedImage = require('./Schemas/sizedImage')

const {
    authUserAlreadyExists,
    authUserNotExists,
    authIncorrectPassword,
    authIncorrectRefreshToken, interactingNoSkuInWishlist, interactingSkuAlreadyInWishlist,
} = require("../utils/errors");
const bcrypt = require("bcrypt");
const crypto = require("crypto")
const jsonwebtoken = require("jsonwebtoken");
const mongoose = require("mongoose");

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
        customer_info: {
            type: {
                name: {
                    type: String,
                    required: true,
                    maxLength: 18
                },
                gender: {
                    type: String,
                    required: true,
                    enum: ['male', 'female']
                },
                cart_id: {
                    type: String,
                    required: true
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
                },
                wishlist: [
                    {
                        type: db.Schema.Types.ObjectId,
                        ref: 'sku'
                    }
                ],
                shipping: {
                    _id: false,
                    type: {
                        location: {
                            type: String,
                            required: true,
                            maxLength: 30
                        },
                        city: {
                            type: String,
                            required: true,
                            maxLength: 30
                        },
                        street: {
                            type: String,
                            required: true,
                            maxLength: 30
                        },
                        house: {
                            type: String,
                            required: true,
                            maxLength: 30
                        },
                        postcode: {
                            type: String,
                            required: true,
                            maxLength: 30
                        },
                        contactInformation: {
                            phone: {
                                type: String,
                                required: false
                            },
                            firstName: {
                                type: String,
                                required: false,
                                maxLength: 30
                            },
                            lastName: {
                                type: String,
                                required: false,
                                maxLength: 30
                            }
                        }
                    }
                },
            },
            _id: false
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    }
)

userSchema.statics.checkUserExists = function (login) {
    return this.exists({'auth.login': login})
}

userSchema.statics.registration = async function (login, password, role, cardId) {
    const isUserExists = await this.checkUserExists(login)
    if (isUserExists) throw authUserAlreadyExists

    const hash = bcrypt.hashSync(password, 5)

    return await this.create({
        role,
        auth: {
            login,
            password: hash,
            card: cardId
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

    return {id, refreshToken, accessToken, expiresIn: Number.parseInt(process.env.ACCESS_TOKEN_EXPIRES)}
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

userSchema.statics.getCustomerData = async function (userId) {
    const info = await
        this.findById(userId)
            .select({
                    'auth.login': 1,
                    'customer_info.name': 1,
                    'customer_info.gender': 1,
                    'customer_info.localization': 1,
                    'customer_info.cart_id': 1
                }
            )
    if (!info) throw authUserNotExists

    return {
        login: info.auth.login,
        name: info.customer_info.name,
        gender: info.customer_info.gender,
        localization: info.customer_info.localization,
        cartId: info.customer_info.cart_id
    }
}

userSchema.statics.setShippingInformation = async function (userId, {
    location,
    city,
    street,
    house,
    postcode,
    phone,
    firstName,
    lastName
}) {
    return await this.updateOne({_id: userId}, {
        $set: {
            'customerInfo.shipping': {
                location,
                city,
                street,
                house,
                postcode,
                contactInformation: {
                    phone,
                    firstName,
                    lastName
                }
            }
        }
    })
}

userSchema.statics.getShippingInformation = async function (userId) {
    const aggregated = await this
        .aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $replaceRoot: {
                    newRoot: '$customer_info.shipping'
                }
            }
        ])
    const user = aggregated[0]

    if (!user) throw authUserNotExists

    return {
        location: user.location,
        city: user.city,
        street: user.street,
        house: user.house,
        postcode: user.postcode,
        phone: user.contactInformation?.phone,
        firstName: user.contactInformation?.firstName,
        lastName: user.contactInformation?.lastName
    }
}

userSchema.statics.addSkuToWishlist = async function (userId, skuId) {
    const data = await this.updateOne({_id: userId}, {
        $addToSet: {
            'customerInfo.wishlist': skuId
        }
    })
    if (!data.modifiedCount) throw interactingSkuAlreadyInWishlist

    return data
}


userSchema.statics.delSkuFromWishlist = async function (userId, skuId) {
    const data = await this.updateOne({_id: userId}, {
        $pull: {
            'customerInfo.wishlist': skuId
        }
    })
    if (!data.modifiedCount) throw interactingNoSkuInWishlist

    return data
}

userSchema.statics.getWishlist = async function (userId, offset = 0, limit = 30) {

    const user = await this.findById(userId)
        .populate({
            path: 'customerInfo.wishlist',
            ref: 'sku'
        })

    if (!user) throw authUserNotExists

    const totalCount = user.customerInfo.wishlist.length

    const wishlist = user.customerInfo.wishlist.slice(offset, offset + limit)

    return {
        wishlist,
        limit,
        offset,
        nextOffset: offset + wishlist.length,
        totalCount
    }
}

module.exports = db.model('user', userSchema, 'users')
