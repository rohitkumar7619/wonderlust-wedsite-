const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isReviewAuthor} = require("../middleware.js");


  
// Create Review Route
router.post("/",
  isLoggedIn,
   wrapAsync(async (req, res, next) => {
  const { id } = req.params; // Extracting id from params
  console.log(id); // This should log the id
  console.log("Review submission started");
  try {
      let listing = await Listing.findById(id);
      if (!listing) {
          console.log("Listing not found");
          throw new ExpressError(404, "Listing not found");
      }
      let newReview = new Review(req.body.review);
      newReview.author = req.user._id;
      listing.reviews.push(newReview);
      await newReview.save();
      await listing.save();
      console.log("Review saved successfully");
      req.flash("success", "new Reviewa Created");
      res.redirect(`/listings/${listing._id}`);
  } catch (err) {
      console.log("Error occurred:", err);
      next(err);
  }
}));



//review delete
router.delete(
  "/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, {pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted");
    res.redirect(`/listings/${id}`);
  })
);

module.exports = router;