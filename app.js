if(process.env.NODE_ENV != "peoduction") {
  require('dotenv').config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const ExpressError = require("./utils/ExpressError.js");
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const SECRET = process.env.SECRET;




//router
const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const user = require("./routes/user.js");

 const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}


app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: SECRET
  }, 
  touchAfter: 24 * 3600
});

store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 *60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};


app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


 // const validateListing = (req, res, next) => {
//   let {error} = listingSchema.validate(req.body);
//   if(error) {
//     let errMsg = error.details.map((el) => el.message).join(",");
//     throw new ExpressError(400, errMsg);
//   } else {
//     next();
//   }  
// };

// const validateReview = (req, res, next) => {
//   let {error} = reviewSchema.validate(req.body);
//   if(error) {
//     let errMsg = error.details.map((el) => el.message).join(",");
//     throw new ExpressError(400, errMsg);
//   } else {
//     next();
//   } 
// };

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});


// app.get("/demouser", async(req, res) => {
//    let fakeuser = new User({
//     email: "rohan@gmail.com",
//     username: "rohan"
//    });

//   let registerUser = await User.register(fakeuser, "helloworld");
//   res.send(registerUser);
// });


app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);
app.use("/", user);

 app.all("*", (req, res, next) => {
  next(new ExpressError(401, "page not found"));
 });



app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render('error', { message: err.message });

});



app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
