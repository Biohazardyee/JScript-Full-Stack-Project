var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

require('./config/database'); 

var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register')
var articlesRouter = require('./routes/articles');
var cartRouter = require('./routes/cart');

const authMiddleware = require('./middleware/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Public routes (no authentication required)
app.use('/login', loginRouter);
app.use('/register', registerRouter);

// Apply auth middleware to protect all routes below this point
app.use(authMiddleware);

// Protected routes (authentication required)
app.use('/articles', articlesRouter);
app.use('/cart', cartRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
