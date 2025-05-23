const https = require('https');

class MatchService {
  constructor() {
    this.API_URL = 'https://v3.football.api-sports.io/fixtures?league=332&season=2025';
    this.API_KEY = '948b105f474030e0a7bbecb4e03da314';
  }

  async getLatestMatches() {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'x-apisports-key': this.API_KEY,
        },
      };

      https.get(this.API_URL, options, (res) => {
        let data = '';

        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const matches = (json.response || []).map((match) => ({
              home: match.teams.home.name,
              away: match.teams.away.name,
              timestamp: new Date(match.fixture.timestamp * 1000).toLocaleString(),
            }));
            resolve(matches);
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);
    });
  }
}

module.exports = MatchService;