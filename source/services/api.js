const https = require('https');
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { pick } = require('stream-json/filters/Pick');
const { streamArray } = require('stream-json/streamers/StreamArray');

const { formatDateForAPI, getFormattedLocalDateTime, getDateWithOffset } = require('../utils/date');

class MatchService {
  constructor() {
    this.API_BASE_URL = 'https://api.football-data.org/v4';
    this.API_TOKEN = process.env.API_TOKEN;
    if (!this.API_TOKEN) {
      throw new Error("API_TOKEN environment variable is not set!");
    }

    this.leaguesMap = {
      'АПЛ': 'PL',
      'Ла Ліга': 'PD',
      'Серія А': 'SA',
      'Бундесліга': 'BL1',
      'Ліга чемпіонів': 'CL',
    };

    this.leagueIds = {
      'PL': 2021, 
      'BL1': 2002,
      'SA': 2019,
      'PD': 2014,
      'FL1': 2015, 
      'CL': 2001  
    };
  }

  async _fetchAndParse(url, type, single = false) { 
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

        if (single) { 
          let rawData = '';
          res.setEncoding('utf8'); 
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            try {
              const parsedData = JSON.parse(rawData);
              resolve(parsedData);
            } catch (err) {
              reject(new Error(`JSON parsing error for URL ${url}: ${err.message}`));
            }
          });
          res.on('error', reject); 
        } else { 
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
        }
      }).on('error', reject);
    });
  }

  async getLeagueStandings(leagueCode) {
    const leagueId = this.leagueIds[leagueCode.toUpperCase()];
    if (!leagueId) {
      throw new Error(`Ліга з кодом ${leagueCode} не знайдена.`);
    }
    const url = `${this.API_BASE_URL}/competitions/${leagueId}/standings`;
    const result = await this._fetchAndParse(url, 'standings');
    if (Array.isArray(result) && result.length > 0 && result[0].table) {
      return result[0].table;
    }
    return result;
  }

  async getLeagueTopScorers(leagueCode) {
    const leagueId = this.leagueIds[leagueCode.toUpperCase()];
    if (!leagueId) {
      throw new Error(`Ліга з кодом ${leagueCode} не знайдена.`);
    }
    const url = `${this.API_BASE_URL}/competitions/${leagueId}/scorers`;
    return this._fetchAndParse(url, 'scorers');
  }

  async getLeagueFixtures(leagueCode) {

    const futureDate = formatDateForAPI(getDateWithOffset(7));
    const pastDate = formatDateForAPI(getDateWithOffset(-7));

    const url = `${this.API_BASE_URL}/competitions/${leagueCode}/matches?dateFrom=${pastDate}&dateTo=${futureDate}`;
    const rawFixtures = await this._fetchAndParse(url, 'matches');

    return rawFixtures.map(match => ({
      homeTeam: match.homeTeam ? match.homeTeam.name : 'Невідома команда',
      awayTeam: match.awayTeam ? match.awayTeam.name : 'Невідома команда', 
      date: getFormattedLocalDateTime(match.utcDate), 
      status: match.status
    }));
  }

  getAvailableLeagueCodes() {
    return Object.keys(this.leagueIds);
  }

  getLeagueButtonsData() {
    return Object.entries(this.leaguesMap).map(([name, code]) => ({
      name: name,
      code: code
    }));
  }

  async getLeagueTeams(leagueCode) {
    const leagueId = this.leagueIds[leagueCode.toUpperCase()];
    if (!leagueId) {
      throw new Error(`Ліга з кодом ${leagueCode} не знайдена.`);
    }
    const url = `${this.API_BASE_URL}/competitions/${leagueId}/teams`;
    return this._fetchAndParse(url, 'teams');
  }

  async getTeamInfoAndMatches(teamId, lastNMatches = 5) {
    const teamInfoUrl = `${this.API_BASE_URL}/teams/${teamId}`;
    const matchesUrl = `${this.API_BASE_URL}/teams/${teamId}/matches?status=FINISHED`;

    const teamInfoRaw = await this._fetchAndParse(teamInfoUrl, '.', true);

    const teamInfo = {
      id: teamInfoRaw.id,
      name: teamInfoRaw.name,
      shortName: teamInfoRaw.shortName,
      tla: teamInfoRaw.tla,
      founded: teamInfoRaw.founded,
      venue: teamInfoRaw.venue,
      website: teamInfoRaw.website
    };

    const rawMatches = await this._fetchAndParse(matchesUrl, 'matches');
    const lastMatches = rawMatches
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
      .slice(0, lastNMatches)
      .map(match => ({
        homeTeam: match.homeTeam ? match.homeTeam.name : 'Невідома команда',
        awayTeam: match.awayTeam ? match.awayTeam.name : 'Невідома команда',
        date: getFormattedLocalDateTime(match.utcDate), 
        score: match.score.fullTime ? `${match.score.fullTime.home} - ${match.score.fullTime.away}` : 'N/A',
        status: match.status,
        winner: match.score.winner
      }));

    return { teamInfo, lastMatches };
  }
}

module.exports = MatchService;