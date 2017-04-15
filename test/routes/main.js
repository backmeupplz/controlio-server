const test = require('unit.js');
const helper = require('../helper');

describe('routes/main.js', function () {
  it('returns list of errors', function (done) {
    helper.request
      .get('/error_list')
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
  it('returns feature list', function (done) {
    helper.request
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
  it('returns apple live links list', function (done) {
    helper.request
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
  it('returns apple live links list', function (done) {
    helper.request
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
  it('returns google live links list', function (done) {
    helper.request
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
  it('returns google live links list', function (done) {
    helper.request
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
  it('returns magic link page with token', function (done) {
    helper.request
      .get('/magic?token=check_token')
      .expect(200, (error, res) => {
        if (error) return done(error);

        test.string(res.text)
          .contains('check_token');
        done();
      });
  });
  it('returns error when magic token not provided', function (done) {
    helper.request
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
