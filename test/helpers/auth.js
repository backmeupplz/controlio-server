const test = require('unit.js');
const helper = require('../helper');

const auth = require('../../helpers/auth');
const config = require('../../config');
const MockExpressRequest = require('mock-express-request');

describe('helpers/auth.js', () => {
  const email = 'test@controlio.co';
  let user;

  before((done) => {
    helper.closeConnectDrop()
      .then(() => helper.addUserWithJWT({ email }))
      .then((dbuser) => {
        user = dbuser;
        done();
      })
      .catch(done);
  });

  after((done) => {
    helper.dropClose()
      .then(done)
      .catch(done);
  });

  it('validates correct api key', (done) => {
    const request = new MockExpressRequest({
      headers: {
        apiKey: config.apiKey,
      },
    });
    auth.checkApiKey(request, null, (err) => {
      test.value(err)
        .isUndefined();
      done();
    });
  });
  it('returns erorr on no api key', (done) => {
    const request = new MockExpressRequest();
    auth.checkApiKey(request, null, (err) => {
      test.value(err)
        .isObject();
      done();
    });
  });
  it('returns error on incorrect api key', (done) => {
    const request = new MockExpressRequest({
      headers: {
        apiKey: 'incorrect',
      },
    });
    auth.checkApiKey(request, null, (err) => {
      test.value(err)
        .isObject();
      done();
    });
  });
  it('returns error on empty string api key', (done) => {
    const request = new MockExpressRequest({
      headers: {
        apiKey: '',
      },
    });
    auth.checkApiKey(request, null, (err) => {
      test.value(err)
        .isObject();
      done();
    });
  });
  it('validates correct jwt', (done) => {
    const request = new MockExpressRequest({
      headers: {
        token: user.token,
      },
    });
    auth.checkToken(request, null, (err) => {
      test.value(err)
        .isUndefined();
      done();
    });
  });
  it('passes user after checking jwt', (done) => {
    const request = new MockExpressRequest({
      headers: {
        token: user.token,
      },
    });
    auth.checkToken(request, null, () => {
      test
        .object(user);
      done();
    });
  });
  it('passes error when no jwt', (done) => {
    const request = new MockExpressRequest();
    auth.checkToken(request, null, (err) => {
      test.value(err)
        .isObject();
      done();
    });
  });
  it('passes error when malformed jwt', (done) => {
    const request = new MockExpressRequest({
      headers: {
        token: 'malformed',
      },
    });
    auth.checkToken(request, null, (err) => {
      test.value(err)
        .isObject();
      done();
    });
  });
  it('passes error when empty string jwt', (done) => {
    const request = new MockExpressRequest({
      headers: {
        token: '',
      },
    });
    auth.checkToken(request, null, (err) => {
      test.value(err)
        .isObject();
      done();
    });
  });
  it('passes error when wrong database jwt', (done) => {
    const request = new MockExpressRequest({
      headers: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZvbWVua28uaW5AZ21haWwuY29tIiwidXNlcmlkIjoiNThkYzc0ZWQzYmZhOTU1NDBiYzY3M2M5IiwiaWF0IjoxNDkwODQyODYxfQ.bxjvJ1K0SQMbLv7hMjOYGty7HUIL-1eMPkalXV_7qKw',
      },
    });
    auth.checkToken(request, null, (err) => {
      test.value(err)
        .isObject();
      done();
    });
  });
});
