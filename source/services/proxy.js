const MatchService = require('./api');

class MatchProxy {
  constructor() {
    this.service = new MatchService();
    this.cache = null;
    this.lastFetch = 0;
    this.cacheTTL = 1000 * 60;
  }

  async getLatestMatches() {
    const now = Date.now();

    if (!this.cache || now - this.lastFetch > this.cacheTTL) {
      console.log('[Proxy] Fetching fresh match data...');
      const allMatches = await this.service.fetchMatches(
        'https://flashscore-json.pages.dev/api/soccer/ukraine:premier-league/'
      );

      this.cache = allMatches.map(match => ({
        home: match.homeTeam.name,
        away: match.awayTeam.name,
        timestamp: new Date(match.startTimestamp * 1000).toLocaleString()
      }));

      this.lastFetch = now;
    } else {
      console.log('[Proxy] Serving from cache...');
    }

    return this.cache;
  }
}

module.exports = MatchProxy;
