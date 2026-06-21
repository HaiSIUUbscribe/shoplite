const axiosModule = require('axios');
const ApiError = require('../utils/ApiError');

const axios = axiosModule.default || axiosModule;

const VIETNAM_LOCATIONS_URL = 'https://provinces.open-api.vn/api/';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cache = null;
let cacheExpiresAt = 0;
let pendingRequest = null;

async function requestVietnamLocations() {
  try {
    const response = await axios.get(VIETNAM_LOCATIONS_URL, {
      params: { depth: 3 },
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024,
      maxRedirects: 5,
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'vi,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; ShopLite/1.0)',
      },
    });

    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Unexpected location response');
    }

    cache = response.data;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return cache;
  } catch (error) {
    console.error('[locations] Failed to load Vietnam locations:', error.message);
    throw new ApiError(
      503,
      'Không thể tải dữ liệu tỉnh thành. Vui lòng thử lại sau.',
      'LOCATION_SERVICE_UNAVAILABLE'
    );
  }
}

exports.getVietnamLocations = async () => {
  if (cache && Date.now() < cacheExpiresAt) return cache;

  if (!pendingRequest) {
    pendingRequest = requestVietnamLocations().finally(() => {
      pendingRequest = null;
    });
  }

  return pendingRequest;
};
