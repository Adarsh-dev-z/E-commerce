






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
