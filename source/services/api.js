const https = require('https');
const { parser } = require('stream-json');
const { pick } = require('stream-json/filters/Pick');
const { streamArray } = require('stream-json/streamers/StreamArray');
const { chain } = require('stream-chain');

class MatchService {
  async getLeagueStandings(leagueCode) {
    const url = `https://api.football-data.org/v4/competitions/${leagueCode}/standings`;
    const options = {
      headers: {
        'X-Auth-Token': '4dc2bb7f92df434da375a6d6d7dec5bc'
      }
    };

    return new Promise((resolve, reject) => {
      https.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Request failed with status ${res.statusCode}`));
        }

        const pipeline = chain([
          parser(),
          pick({ filter: 'standings.0.table' }),
          streamArray()
        ]);

        const standings = [];

        pipeline.on('data', ({ value }) => {
          standings.push({
            name: value.team.name,
            points: value.points
          });
        });

        pipeline.on('end', () => resolve(standings));
        pipeline.on('error', (err) => reject(err));

        res.pipe(pipeline);
      }).on('error', reject);
    });
  }
}

module.exports = MatchService;
