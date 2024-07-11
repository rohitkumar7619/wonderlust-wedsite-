const Review = require("../models/review.js");
const Listing = require("../models/listing.js");


module.exports.createReview = async (req, res, next) => {
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
  };



  module.exports.deleteReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, {pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted");
    res.redirect(`/listings/${id}`);
  };