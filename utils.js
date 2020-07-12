const axios = require("axios");
const Advert = require("./models/Advert");
const Image = require("./models/Image");
const Message = require("./models/Message");
const User = require("./models/User");
const { Op } = require("sequelize");
const FormData = require("form-data");
const { datauri } = require('./config/multer');
const dotenv = require("dotenv");
dotenv.config();

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

exports.getLocationDetails = async (postcode) => {
 try {
		return await axios.get(
			`https://api.postcodes.io/postcodes/${postcode}`
    );
  } catch (err) {
		return null
	} 
}

exports.postAdWithCustomPostcode = async (user, body, response) => {
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
      const ad = await Advert.create({
        ...body,
        seller_id: user.id,
        seller_name: user.name,
        contact_email: user.email,
        postcode,
        longitude,
        latitude,
        location:
          `${admin_ward}, ` ||
          "" + `${admin_county}, ` ||
          "" + `${region}, ` ||
          "",
      });
      return ad.id;
    } catch (err) {
      return false
    }
  }
};

exports.postAdWithRegisterPostcode = async (user, body) => {
	const { postcode, longitude, latitude, location } = user;

	try {
		const ad = await Advert.create({
			...body,
			seller_id: user.id,
			seller_name: user.name,
			contact_email: user.email,
			postcode,
			longitude,
			latitude,
			location,
		});
		return ad.id
	} catch (err) {
    return false
	}
};

const orderParams = (sort_by) => {
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

exports.updateAdvertIsSuccessful = async (ad, fieldsToUpdate) => {
  try {
    await ad.update({...fieldsToUpdate})
    return true
  } catch (err) {
    return false
  }		
};

exports.getAdsFromDbWithPriceParams = async (term, min_price, max_price, sort_by) => {

  const ads = await Advert.findAll({
    raw: true,
    where: {
      [Op.or]: {
        title: {
          [Op.iLike]: `%${term}%`,
        },
        description: {
          [Op.iLike]: `%${term}%`,
        }
      },
      price: {
        [Op.between]: [min_price || 0, max_price || 100000],
      },
    },
    order: orderParams(sort_by),
  });
  return ads;
};

exports.getImgUrlsFromDb = async (advert_id) => {
  try {
    const images = await Image.findAll({
      raw: true,
      where: { advert_id }
    });
    return images.map(image => image.url);
  } catch (err) {
    console.log(err)
    return null
  }
};

exports.addAdsImgUrl = async (ads) => {
  return await Promise.all( ads.map( 
    async (ad) => {
      const urls = await getImgUrlsFromDb(ad.id);
      return { ...ad, urls }
    }
  ));
}; 

exports.addImgUrlInDb = async (advert_id, urls) => {
  try {
    await Promise.all(urls.forEach( async url => await Image.create({ advert_id, url })) )
    return true
  } catch (err) {
    return false
  }
};

exports.getImgUrlFromStorage = async (buffer) => {
	
	const image = datauri.format('.png', buffer).base64;
	const form = new FormData();
	form.append('image', image);
	const url = `https://api.imgbb.com/1/upload?key=${process.env.IMG_API_KEY}`;
	const response = await axios.post(url, form, {
		headers: form.getHeaders()
	});
	const { status, data } = response.data;
	return status === 200 ? data.url : null
};

exports.getAdInfo = async (id) => {
  const ad = await Advert.findByPk(id, { raw: true });
  const urls = await getImgUrlsFromDb(id);
  return { ...ad, urls }
};

exports.getMessagesByUserId = async (user_id) => {
  const messages = await Message.findAll({ 
    raw: true,
    where: { recipient_id : user_id }
  });
  const messagesWithSenderName = await Promise.all(messages.map(
    async message => { 
      const { name } = await User.findByPk(message.sender_id, {
        raw: true,
        attributes: ['name']
      });
      const { title } = await Advert.findByPk(message.advert_id, {
        raw: true,
        attributes: ['title']
      });
      return { ...message, sender_name: name, advert_title: title }
    }
  ));
  return messagesWithSenderName
};

exports.sendMessageIsSuccess = async (sender_id, recipient_id, advert_id, content) => {
  try {
    await Message.create({
			sender_id,
			recipient_id,
			advert_id,
			content,
			is_read: false,
    });
    return true
  } catch (err) {
    console.log(err)
    return false
  }
};

exports.toggleMessageIsRead = async (message_id, is_read) => {
  await Message.update({ is_read: !is_read }, {
    where: { id: message_id } 
  });
}