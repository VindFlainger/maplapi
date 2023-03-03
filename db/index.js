const mongoose = require('mongoose')

mongoose.connect('mongodb://LAPTOP-HHIAGJDC:27017,LAPTOP-HHIAGJDC:27018,LAPTOP-HHIAGJDC:27019/mapl?replicaSet=rs', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

module.exports = mongoose
