class MatchProxy {
  constructor(service) {
    if (!service) {
      throw new Error('MatchService instance must be provided to MatchProxy');
    }
    this.service = service;
    this.cache = new Map(); 
    this.cacheTTL = 1000 * 60; 
    this.cleanupInterval = 1000 * 30; 
  }

  async getLeagueStandings(leagueCode) { 
    const now = Date.now();
    const cacheKey = leagueCode;

    const cachedEntry = this.cache.get(cacheKey);

    if (cachedEntry && now - cachedEntry.lastFetch < this.cacheTTL) {
      console.log(`[MatchProxy] Serving standings for ${leagueCode} from cache...`);
      return cachedEntry.data;
    }

    console.log(`[MatchProxy] Fetching fresh standings for ${leagueCode}...`);

    if (cachedEntry) {
        this.cache.delete(cacheKey);
    }

    try {
      const freshData = await this.service.getLeagueStandings(leagueCode); 

      this.cache.set(cacheKey, {
        lastFetch: now,
        data: freshData
      });

      return freshData;
    } catch (error) {
      console.error(`[MatchProxy] Error fetching standings for ${leagueCode}:`, error);
      if (cachedEntry) {
        console.warn(`[MatchProxy] Returning stale cache data for ${leagueCode} due to error.`);
        return cachedEntry.data;
      }
      throw new Error(`Failed to fetch standings for ${leagueCode} and no cache available.`);
    }
  }

  clearCache(url) {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }
}

module.exports = MatchProxy;