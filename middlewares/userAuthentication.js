




// const express = require("express");


// const AuthCheck = (req, res, next) => {
//   if (req.session.user || req.session.admin) {
//     req.user = req.session.user;
//     req.admin = req.session.admin
//     next();
//   } else {
//     res.redirect("/login");
//   }
// };





// module.exports = {
//   // userRegister,
//   AuthCheck,
  
// };







const userAuthCheck = (req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user;
    next();
  } else {
    res.redirect("/login");
  }
};

const adminAuthCheck = (req, res, next) => {
  if (req.session.admin) {
    req.admin = req.session.admin;
    next();
  } else {
    res.redirect("/login");
  }
};





module.exports = {
  userAuthCheck,
  adminAuthCheck,
};
