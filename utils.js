const axios = require("axios");
const Advert = require("./models/Advert");

// Haversine formula
const getDistance = (p1, p2, isInMiles) => {
  const R = 6378137; // Earth’s mean radius in meter
  const rad = x => (x * Math.PI) / 180;
	const dLat = rad(p2.lat - p1.lat);
	const dLong = rad(p2.lng - p1.lng);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(rad(p1.lat)) *
			Math.cos(rad(p2.lat)) *
			Math.sin(dLong / 2) *
			Math.sin(dLong / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const km = (R * c)/1000;
  const result = isInMiles ? km * 0.621371 : km; // returns the distance in kilometers / miles
  return parseFloat(result.toFixed(1));
};

exports.addDistanceForAds = (ads, userLocation) => {
	adsWithDistance = [];
	ads.forEach((ad) => {
		const sellerLocation = {
			lat: ad["latitude"],
			lng: ad["longitude"],
		};
		const distance = getDistance(userLocation, sellerLocation, true);
		adsWithDistance.push({ ...ad, distance });
	});
	return adsWithDistance;
};

exports.checkAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/login");
};

exports.postAdWithCustomPostcode = async (req, res) => {
	try {
		const response = await axios.get(
			`https://api.postcodes.io/postcodes/${req.body.custom_postcode}`
		);
		const { status } = response;
		const {
			postcode,
			longitude,
			latitude,
			admin_ward,
			admin_county,
			region,
		} = response.data.result;

		if (status === 200) {
			try {
				await Advert.create({
					...req.body,
					seller_id: req.user.id,
					seller_name: req.user.name,
					contact_email: req.user.email,
					postcode,
					longitude,
					latitude,
					location:
						`${admin_ward}, ` ||
						"" + `${admin_county}, ` ||
						"" + `${region}, ` ||
						"",
				});
				res.redirect("/ads/myads");
			} catch (err) {
				res.render("post", {
					errorMessage: "Failed to post advert",
					...req.body,
				});
			}
		}
	} catch (err) {
		res.render("post", {
			errorMessage: "Invalid postcode",
			...req.body,
		});
	}
};

exports.postAdWithRegisterPostcode = async (req, res) => {
	const { postcode, longitude, latitude, location } = req.user;

	try {
		await Advert.create({
			...req.body,
			seller_id: req.user.id,
			seller_name: req.user.name,
			contact_email: req.user.email,
			postcode,
			longitude,
			latitude,
			location,
		});
		res.redirect("/ads/myads");
	} catch (err) {
		res.render("post", {
			errorMessage: "Failed to post advert",
			...req.body,
		});
	}
};

exports.sortByPrice = (sort_by) => {
	switch (sort_by) {
		case "price_desc":
			return [["price", "DESC"]];
		case "price_asc":
			return [["price", "ASC"]];
		default:
			return null;
	}
};

exports.sortAdsByDistance = (sort_by, ads) => {
	switch (sort_by) {
		case "distance_asc":
			return ads.sort( (a, b) => parseFloat(a.distance) - parseFloat(b.distance) )
		case "distance_desc":
			return ads.sort( (a, b) => parseFloat(b.distance) - parseFloat(a.distance) )
		default:
			null;
	};
};

exports.updateAdvert = async (req, res, ad, fieldsToUpdate) => {
  try {
    await ad.update({...fieldsToUpdate})
    res.render("edit_ads", { successMessage: "Changes saved successfully", ...req.body })
  } catch (err) {
    console.log(err);
    res.render("edit_ads", { errorMessage: "Failed to save changes", ...req.body });
  }		
};

exports.deleteAdvert = (res, ad) => {
  try {
    ad.destroy();
    res.redirect("/ads/myads");
  } catch (err) {
    console.log(err);
    res.render("edit_ads", { errorMessage: "Failed to delete" });
  }
};
