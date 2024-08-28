module.exports.admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
      return next();
    }
    res.redirect('/login');
  };  