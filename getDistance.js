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

module.exports = getDistance;
