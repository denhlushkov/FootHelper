class MatchProxy {
  constructor(service) {
    this.service = service;
    this.cache = null;
    this.lastFetch = 0;
    this.cacheTTL = 1000 * 60;
  }

  async getLatestMatches() {
    const now = Date.now();

    if (!this.cache || now - this.lastFetch > this.cacheTTL) {
      console.log('[MatchProxy] Fetching fresh data...');
      this.cache = await this.service.getLatestMatches();
      this.lastFetch = now;
    } else {
      console.log('[MatchProxy] Serving from cache...');
    }

    return this.cache;
  }
}

module.exports = MatchProxy;