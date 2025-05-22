const MatchService = require('./api');

class MatchProxy {
  constructor() {
    this.service = new MatchService();
    this.cache = new Map(); 
    this.cacheTime = 1000 * 60;
  }

  async getLatestMatches() {
    const url = 'https://flashscore-json.pages.dev/api/soccer/ukraine:premier-league/';
    const now = Date.now();

    const cached = this.cache.get(url);
    if (cached && now - cached.lastFetch < this.cacheTime) {
      console.log('[Proxy] Serving from cache...');
      return cached.data;
    }
    
    try {
      console.log('[Proxy] Fetching fresh match data...');
      const allMatches = await this.service.fetchMatches(url);

      const processed = allMatches.map(match => ({
        home: match.homeTeam.name,
        away: match.awayTeam.name,
        timestamp: new Date(match.startTimestamp * 1000).toLocaleString()
      }));

      this.cache.set(url, {
        lastFetch: now,
        data: processed
      });

      return processed;
    } catch (error) {
      console.error('[Proxy] Error fetching data:', error);
      if (cached) {
        console.warn('[Proxy] Returning stale cache data due to error.');
        return cached.data;
      }
      throw new Error('Failed to fetch match data and no cache available.');
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
