const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require('../schema.js');
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer  = require('multer')
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding ({ accessToken: mapToken });


router.route("/")
.get( wrapAsync(listingController.index))
.post(isLoggedIn,
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
    console.log(savedListing);
    req.flash("success", "new listing created!");
    res.redirect("/listings");

})); 
 

//New Route
router.get("/new",isLoggedIn, listingController.renderNewForm);

router.route("/:id")
.get( wrapAsync(listingController.showListing))
.put( isLoggedIn, upload.single('listing[image]'), isOwner, wrapAsync(listingController.updateListing))
.delete( isLoggedIn, isOwner, upload.single("listing[image]") ,wrapAsync(listingController.deleteListing)); 



//Edit Route
router.get("/:id/edit",isLoggedIn, isOwner, wrapAsync(listingController.editListing));


module.exports = router;