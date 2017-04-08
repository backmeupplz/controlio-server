const test = require('unit.js');
const demo = require('../../helpers/demo');
const MockExpressRequest = require('mock-express-request');
const helper = require('../helper');

describe('helpers/demo.js', function () {
  const demoEmail = 'demo@controlio.co';
  const usualEmail = 'usual@controlio.co';
  let demoUser;
  let usualUser;

  before(function (done) {
    helper.closeConnectDrop()
      .then(() => {
        const promises = [
          helper.addUserWithJWT({ email: demoEmail, isDemo: true }),
          helper.addUserWithJWT({ email: usualEmail, isDemo: false }),
        ];
        return Promise.all(promises);
      })
      .then((users) => {
        demoUser = users[0];
        usualUser = users[1];
        done();
      })
      .catch(done);
  });

  after(function (done) {
    helper.dropClose()
      .then(done)
      .catch(done);
  });

  it('validates not demo user', function (done) {
    const request = new MockExpressRequest();
    request.user = usualUser;
    demo.checkDemo(request, null, (err) => {
      test.value(err)
        .isUndefined();
      done();
    });
  });

  it('returns an error on demo user', function (done) {
    const request = new MockExpressRequest();
    request.user = demoUser;
    demo.checkDemo(request, null, (err) => {
      test.object(err);
      done();
    });
  });
});
