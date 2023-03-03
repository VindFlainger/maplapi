const db = require('./index')

const schema = new db.Schema({
    owner: {
        type: db.Schema.Types.ObjectId,
        rel: 'user',
        required: true
    },

})