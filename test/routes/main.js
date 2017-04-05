const test = require('unit.js');
const request = require('supertest');
const app = require('../../app');

describe('routes/main.js', () => {
  it('returns feature list', (done) => {
    request(app)
      .get('/feature_list')
      .expect(200, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns apple live links list', (done) => {
    request(app)
      .get('/.well-known/apple-app-site-association')
      .expect(200, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns apple live links list', (done) => {
    request(app)
      .get('/apple-app-site-association')
      .expect(200, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns google live links list', (done) => {
    request(app)
      .get('/.well-known/assetlinks.json')
      .expect(200, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns google live links list', (done) => {
    request(app)
      .get('/assetlinks.json')
      .expect(200, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns magic link page with token', (done) => {
    request(app)
      .get('/magic?token=check_token')
      .expect(200, (error, res) => {
        if (error) return done(error);

        test.string(res.text)
          .contains('check_token');
        done();
      });
  });
  it('returns error when magic token not provided', (done) => {
    request(app)
      .get('/magic')
      .expect(400, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
});
