const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const auth = require('./routes/auth');
const RequestError = require("./utils/RequestError");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));

app.use('/auth', auth);

app.use(function (req, res, next) {

});

// error handler
app.use(function (err, req, res, next) {
    if (err instanceof RequestError) {
        res.status(err.status).json({
            code: err.code,
            message: err.message,
        })
    } else {
        res.status(400).json({
            code: 0,
            message: err.message
        })
    }
});


app.listen(process.env.PORT)

module.exports = app;
