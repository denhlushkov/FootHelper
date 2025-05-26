class MatchProxy {
  constructor(service) {
    if (!service) {
      throw new Error('MatchService instance must be provided to MatchProxy');
    }
    this.service = service;
    this.cache = new Map();
    this.cacheTime = 1000 * 60 * 5;
    this.cleanupInterval = 1000 * 60;

    this.startCleanupTimer();
  }

  async _getData(leagueCode, dataType, fetchFunction) {
    const now = Date.now();
    const leagueCache = this.cache.get(leagueCode) || new Map();
    const cachedEntry = leagueCache.get(dataType);

    if (cachedEntry && now - cachedEntry.lastFetch < this.cacheTime) {
      console.log(`[MatchProxy] Serving ${dataType} for ${leagueCode} from cache...`);
      return cachedEntry.data;
    }

    console.log(`[MatchProxy] Fetching fresh ${dataType} for ${leagueCode}...`);
    if (cachedEntry) {
      leagueCache.delete(dataType);
    }

    try {
      const freshData = await fetchFunction(leagueCode);

      leagueCache.set(dataType, {
        lastFetch: now,
        data: freshData
      });
      this.cache.set(leagueCode, leagueCache);

      return freshData;
    } catch (error) {
      console.error(`[MatchProxy] Error fetching ${dataType} for ${leagueCode}:`, error);
      if (cachedEntry) {
        console.warn(`[MatchProxy] Returning stale cache data for ${leagueCode} (${dataType}) due to error.`);
        return cachedEntry.data;
      }
      throw new Error(`Failed to fetch ${dataType} for ${leagueCode} and no cache available: ${error.message}`);
    }
  }

  async getLeagueStandings(leagueCode) {
    return this._getData(leagueCode, 'standings', this.service.getLeagueStandings.bind(this.service));
  }

  async getLeagueFixtures(leagueCode) {
    return this._getData(leagueCode, 'fixtures', this.service.getLeagueFixtures.bind(this.service));
  }

  startCleanupTimer() {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      const leaguesToRemove = [];

      for (const [leagueCode, leagueCache] of this.cache.entries()) {
        const dataTypesToRemove = [];
        for (const [dataType, entry] of leagueCache.entries()) {
          if (now - entry.lastFetch >= this.cacheTime) {
            dataTypesToRemove.push(dataType);
            cleanedCount++;
          }
        }
        dataTypesToRemove.forEach(dataType => leagueCache.delete(dataType));

        if (leagueCache.size === 0) {
          leaguesToRemove.push(leagueCode);
        }
      }
      leaguesToRemove.forEach(leagueCode => this.cache.delete(leagueCode));


      if (cleanedCount > 0) {
        console.log(`[MatchProxy] Cleaned up ${cleanedCount} expired cache entries.`);
      }
    }, this.cleanupInterval);
    console.log(`[MatchProxy] Cache cleanup timer started, runs every ${this.cleanupInterval / 1000} seconds.`);
  }

  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('[MatchProxy] Cache cleanup timer stopped.');
    }
  }

  clearCache(leagueCode, dataType) {
    if (leagueCode) {
      const leagueCache = this.cache.get(leagueCode);
      if (leagueCache) {
        if (dataType) {
          if (leagueCache.delete(dataType)) {
              console.log(`[MatchProxy] Manually cleared cache for ${leagueCode}/${dataType}.`);
          } else {
              console.log(`[MatchProxy] No cache found for ${leagueCode}/${dataType}.`);
          }
        } else {
          this.cache.delete(leagueCode);
          console.log(`[MatchProxy] Manually cleared all cache for ${leagueCode}.`);
        }
        if (leagueCache.size === 0) {
            this.cache.delete(leagueCode);
        }
      } else {
        console.log(`[MatchProxy] No cache found for ${leagueCode}.`);
      }
    } else {
      this.cache.clear();
      console.log('[MatchProxy] Manually cleared all cache entries.');
    }
  }
}

module.exports = MatchProxy;