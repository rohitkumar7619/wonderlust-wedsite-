const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const { route } = require("./listing");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const usercontroller = require("../controllers/user.js");

router.route("/signup")
    .get(usercontroller.renderSignup)
    .post(wrapAsync(usercontroller.signup)
);

router.route("/login")
    .get(usercontroller.renderLoginup)
    .post(
        saveRedirectUrl,
        passport.authenticate("local",
            {
                failureRedirect: "/login",
                failureFlash: true,
            }),
        usercontroller.login
);


router.get("/logout", usercontroller.logout);

module.exports = router;