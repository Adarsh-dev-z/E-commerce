var createError = require('http-errors');
var express = require('express');

require("dotenv").config()

var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport =require("passport");
const session = require("express-session");
const compression = require('compression');
const db=require('./config/db/config')
// const MongoDBStore = require("connect-mongodb-session")(session);
require("./config/passport-config")(passport)
const hbs = require("express-handlebars");
var app = express();
const port=process.env.PORT || 3000;
//****************************************
const Handlebars = require('handlebars')
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
//****************************************
const flash = require('connect-flash');

const hbsHelpers = {
  eq: function (a, b) {
      return a === b;
  },
  or: function () {
      const args = Array.prototype.slice.call(arguments, 0, -1);
      return args.some(Boolean);
  },
  json: function (context) {
      return JSON.stringify(context);
  },
  not: function(value) {
      return !value;
  },
  and: function() {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(Boolean);
},
isProductReturned: function (productId, returnItems, options) {
    const returned = returnItems.some(item => item.product.toString() === productId.toString() && !item.success);
    return returned ? options.fn(this) : options.inverse(this);
  }
};

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    partialsDir: __dirname + "/views/user/partials/",
    layoutsDir: __dirname + '/views/user/layouts/',
    helpers: hbsHelpers,
    //************************************************
    handlebars: allowInsecurePrototypeAccess(Handlebars)
    //************************************************

    //*******************************
    // protectedProperties: true
   //*******************************

  })
);
// const GoogleStrategy= require("passport-google-oauth20").Strategy;

app.use(compression());


app.use(session({
  secret:process.env.SECRET_KEY,
  resave:false,
  saveUninitialized:false,
  cookie: { maxAge: 600000*24 },
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});




app.use(passport.initialize());
app.use(passport.session());

// app.get('/verify', require('./controller/userController').handleVerification);


var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
const { AuthCheck } = require('./middlewares/userAuthentication');
const { getCart, miniCart } = require('./controller/userController');


app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.user ? true : false;
  next();
});


app.use('/asset/images', (req, res, next) => {
  if (path.join(__dirname, "/images")) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); 
    next();
  } else {
    next(new Error('Failed to load images'));
  }
}, express.static(path.join(__dirname, "/images")));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set("views", path.join(__dirname, "views"));
app.use("/images", express.static(path.join(__dirname, "/images")));
app.use('/', usersRouter);
app.use('/', adminRouter)

app.use(function(req, res, next) {
  next(createError(404));
});



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;

