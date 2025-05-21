const https = require('https');

class MatchService {
  async fetchMatches(url) {
    return new Promise((resolve, reject) => {
      https.get(url, res => {
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.events || []);
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);
    });
  }
}
module.exports = MatchService;