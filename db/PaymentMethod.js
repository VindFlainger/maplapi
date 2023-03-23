const db = require('./index')
const {
    interactingToManyMethods,
    interactionNoPaymentMethod
} = require("../utils/errors");

const schema = new db.Schema({
    ownerId: {
        type: db.Schema.Types.ObjectId,
        ref: 'user',
        select: false
    },
    number: {
        type: String,
        required: true,
        validate: {
            validator: v => /^\d{16}$/.test(v),
            message: props => `${props.value} is not a valid card number!`
        }
    },
    expire: {
        type: String,
        required: true,
        validate: {
            validator: v => /^(0[123456789]|11|12)\/\d{2}$/.test(v),
            message: props => `${props.value} is not a valid expire date!`
        }
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    id: true,
    toJSON: {
        versionKey: false,
        virtuals: true
    }
})

schema.statics.addMethod = async function (userId, {number, expire, isDefault}) {
    const methods = await this.find({
        ownerId: userId
    })

    if (isDefault && methods.find(method => method.isDefault)) {
        await this.updateMany({
            ownerId: userId
        }, {
            $set: {
                isDefault: false
            }
        })
    }

    if (methods.length >= 5) throw interactingToManyMethods


    return await this.create({
        ownerId: userId,
        number,
        expire,
        isDefault
    })
}

schema.statics.delMethod = async function (userId, paymentId) {
    const data = await this.deleteOne({
        ownerId: userId,
        _id: paymentId
    })
    if (!data.deletedCount) throw interactionNoPaymentMethod

    return data
}


schema.statics.setDefault = async function (userId, paymentId) {
    await this.updateMany({
        ownerId: userId
    }, {
        $set: {
            isDefault: false
        }
    })

    const data = await this.updateOne({
        ownerId: userId,
        _id: paymentId
    }, {
        $set: {
            isDefault: true
        }
    })

    if (!data.modifiedCount) throw interactionNoPaymentMethod

    return data
}

schema.statics.getMethods = async function(userId){
    return await this.find({
        ownerId: userId
    })
}

module.exports = db.model('paymentMethod', schema, 'paymentMethods')