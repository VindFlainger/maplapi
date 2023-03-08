const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const auth = require('./routes/auth');
const customer = require('./routes/customer');
const catalog = require('./routes/catalog');
const RequestError = require("./utils/RequestError");
const {generalPathNotFound} = require("./utils/errors");

const app = express();

app.use((req, res, next) => {
    res.header("access-control-allow-credentials", "true");
    res.header('access-control-allow-methods', '*');
    res.header("Access-Control-Allow-Origin", "http://192.168.100.7:8080");
    res.header("Referrer-Policy", "unsafe-url");
    next();
});

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use('/static', express.static(path.join('static')));

app.use('/auth', auth);
app.use('/customer', customer);
app.use('/catalog', catalog);

app.use(function (req, res, next) {
    next(generalPathNotFound)
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
