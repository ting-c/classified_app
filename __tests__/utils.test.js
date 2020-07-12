// setup a fake DB connection
// const SequelizeMock = require("sequelize-mock");
// const dbMock = new SequelizeMock();

const {
	addDistanceForAds,
	sortAdsByDistance,
	getImgUrlsFromDb,
} = require("../utils.js");

describe('Testing addDistanceForAds function', () => {
   const mockAds = [
			{ id: 1, title: "Title 1", longitude: 3.1, latitude: 50.1 },
			{ id: 2, title: "Title 2", longitude: 4.1, latitude: 53.1 },
		];
		const mockUserLocation = { longitude: 4.1, latitude: 53.1 };

  it("return an array", () => {
    expect(addDistanceForAds(mockAds, mockUserLocation)).toBeInstanceOf(Array);
  });

  it("first element of the array has distance property", () => {
    expect(addDistanceForAds(mockAds, mockUserLocation)[0]).toHaveProperty('distance');
  });

});

describe('Testing sortAdsByDistance function', () => {
  const mockAds = [
    { id: 1, distance: 100 },
    { id: 3, distance: 300 },
    { id: 2, distance: 200 }
  ];
  const mockAdsInASC = [
		{ id: 1, distance: 100 },
		{ id: 2, distance: 200 },
		{ id: 3, distance: 300 }
  ];
  const mockAdsInDESC = [
		{ id: 3, distance: 300 },
		{ id: 2, distance: 200 },
		{ id: 1, distance: 100 }
  ];
  
  it("return ads in ascending order", () => {
    expect(sortAdsByDistance("distance_asc", mockAds)).toEqual(mockAdsInASC)
  });

  it("return ads in descending order", () => {
    expect(sortAdsByDistance("distance_desc", mockAds)).toEqual(mockAdsInDESC)
  });
});

describe("getImageUrlFromDb", () => {
	it("should return an array of urls for existing advert", async () => {
    const urls = await getImgUrlsFromDb(110);
    expect(urls).toBeInstanceOf(Array);
  });  
});
