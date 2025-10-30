/* global jest */

function Pool(_params) {
  return {
    query: jest.fn().mockImplementation((sql) => {
      if (sql.includes('metro.defaults')) {
        return Promise.resolve({ rows: [{ value: { line: 'M1', tz: 'Europe/Paris' } }] });
      }
      if (sql.includes('metro.last')) {
        return Promise.resolve({ rows: [{ value: { Chatelet: '00:45' } }] });
      }
      return Promise.resolve({ rows: [] });
    }),
    connect: jest.fn(),
    end: jest.fn(),
  };
}

module.exports = { Pool };
