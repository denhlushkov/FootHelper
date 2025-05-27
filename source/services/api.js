const https = require('https');
const { parser } = require('stream-json');
const { pick } = require('stream-json/filters/Pick');
const { streamArray } = require('stream-json/streamers/StreamArray');
const { chain } = require('stream-chain');

class MatchService {
  constructor() {
    this.API_TOKEN = process.env.API_TOKEN;
    if (!this.API_TOKEN) {
      throw new Error('API_TOKEN environment variable is not set!');
    }
  }

  async _fetchAndParse(url, type) {
    const options = {
      headers: {
        'X-Auth-Token': this.API_TOKEN
      }
    };

    return new Promise((resolve, reject) => {
      https.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          if (res.statusCode === 429) {
            return reject(new Error(`API Rate Limit Exceeded for URL: ${url}. Please wait and try again.`));
          }
          return reject(new Error(`Request failed with status ${res.statusCode} for URL: ${url}`));
        }

        const pipeline = chain([
          parser(),
          pick({ filter: type }),
          streamArray()
        ]);

        const data = [];

        pipeline.on('data', ({ value }) => {
          data.push(value);
        });

        pipeline.on('end', () => resolve(data));
        pipeline.on('error', (err) => reject(new Error(`JSON parsing error for URL ${url}: ${err.message}`)));

        res.pipe(pipeline);
      }).on('error', reject);
    });
  }

  async getLeagueStandings(leagueCode) {
    const url = `https://api.football-data.org/v4/competitions/${leagueCode}/standings`;
    const rawStandings = await this._fetchAndParse(url, 'standings.0.table');

    return rawStandings.map(team => ({
      name: team.team.name,
      points: team.points
    }));
  }

  async getLeagueFixtures(leagueCode) {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 7);
    const past = new Date();
    past.setDate(today.getDate() - 7);

    const futureDate = future.toISOString().split('T')[0];
    const pastDate = past.toISOString().split('T')[0];

    const url = `https://api.football-data.org/v4/competitions/${leagueCode}/matches?dateFrom=${pastDate}&dateTo=${futureDate}`;
    const rawFixtures = await this._fetchAndParse(url, 'matches');

    return rawFixtures.map(match => ({
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      date: new Date(match.utcDate).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: match.status
    }));
  }
}

module.exports = MatchService;