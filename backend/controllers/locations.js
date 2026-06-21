const locationService = require('../services/locationService');

exports.getVietnamLocations = async (req, res, next) => {
  try {
    const locations = await locationService.getVietnamLocations();
    return res.json(locations);
  } catch (error) {
    return next(error);
  }
};
