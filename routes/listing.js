const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require('../schema.js');
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const multer  = require('multer')
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding ({ accessToken: mapToken });


//Index Route
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));

//New Route
router.get("/new",isLoggedIn, (req, res) => {
   res.render("listings/new.ejs");
});

//Show Route
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path: "reviews",
        populate: {
          path: "author",
        },
    })
    .populate("owner");
    if(!listing) {
        req.flash("error", "Listing You Required for does not exist");
        res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing });
}));

//Create Route
router.post("/", isLoggedIn,
    upload.single('listing[image]'),
    wrapAsync(async (req, res, next) => {
        let result = listingSchema.validate(req.body);
        if (result.error) {
            throw new ExpressError(400, result.error)
        }

        let response = await geocodingClient
        .forwardGeocode({
            query: req.body.listing.location,
            limit: 1, 
          })
            .send();
    
        let url = req.file.path;
        let filename = req.file.filename;
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = {url, filename};
    
        newListing.geometry = response.body.features[0].geometry;
        
        let savedListing = await newListing.save();
        req.flash("success", "new listing created!");
        res.redirect("/listings");
    })
); 


//Edit Route
router.get("/:id/edit",
    isLoggedIn,
    isOwner,
     wrapAsync(async (req, res,) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "listing you requesting for does not exist!");
    res.redirect(`/listings`);
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
}));

//Update Route
router.put("/:id",
    isLoggedIn,
    isOwner,
    upload.single('listing[image]'),
     wrapAsync(async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "send valaid data for listing");
    }
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if(typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url, filename};
    await listing.save();
    }

    req.flash("success", "listing Updated");
    res.redirect(`/listings/${id}`);
}));

//Delete Route
router.delete("/:id",
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
     wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    // console.log(deletedListing);
    req.flash("success", "listing Deleted");
    res.redirect("/listings");
})); 

module.exports = router;