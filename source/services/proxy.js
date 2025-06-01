class MatchProxy {
  constructor(service) {
    if (!service) {
      throw new Error('MatchService instance must be provided to MatchProxy');
    }
    this.service = service;
    this.cache = new Map();
    this.teamCache = new Map();
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

  async getLeagueTopScorers(leagueCode) {
    return this._getData(leagueCode, 'topscorers', this.service.getLeagueTopScorers.bind(this.service));
  }

  getAvailableLeagueCodes() {
    return this.service.getAvailableLeagueCodes();
  }

  getLeagueButtonsData() {
    return this.service.getLeagueButtonsData();
  }

  async getLeagueTeams(leagueCode) {
    return this._getData(leagueCode, 'teams', this.service.getLeagueTeams.bind(this.service));
  }

  async getTeamInfoAndMatches(teamId, lastNMatches = 5) {
    const now = Date.now();
    const cacheKey = `team_info_matches_${teamId}`; 
    const cachedEntry = this.teamCache.get(cacheKey);

    if (cachedEntry && now - cachedEntry.lastFetch < this.cacheTime) {
      console.log(`[MatchProxy] Serving team info/matches for ${teamId} from cache...`);
      return cachedEntry.data;
    }

    console.log(`[MatchProxy] Fetching fresh team info/matches for ${teamId}...`);
    if (cachedEntry) {
      this.teamCache.delete(cacheKey);
    }

    try {
      const freshData = await this.service.getTeamInfoAndMatches(teamId, lastNMatches);

      this.teamCache.set(cacheKey, {
        lastFetch: now,
        data: freshData
      });

      return freshData;
    } catch (error) {
      console.error(`[MatchProxy] Error fetching team info/matches for ${teamId}:`, error);
      if (cachedEntry) {
        console.warn(`[MatchProxy] Returning stale cache data for team ${teamId} due to error.`);
        return cachedEntry.data;
      }
      throw new Error(`Failed to fetch team info/matches for ${teamId} and no cache available: ${error.message}`);
    }
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

      const teamCacheKeysToRemove = [];
      for (const [cacheKey, entry] of this.teamCache.entries()) {
        if (now - entry.lastFetch >= this.cacheTime) {
          teamCacheKeysToRemove.push(cacheKey);
          cleanedCount++;
        }
      }
      teamCacheKeysToRemove.forEach(cacheKey => this.teamCache.delete(cacheKey));

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
}

module.exports = MatchProxy;