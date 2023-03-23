const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://alex:Gemger2003@mapl.ubarphe.mongodb.net/mapl?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

module.exports = mongoose