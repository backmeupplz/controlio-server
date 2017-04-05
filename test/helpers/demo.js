const test = require('unit.js');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const demo = require('../../helpers/demo');
const config = require('../../config');
const MockExpressRequest = require('mock-express-request');
const db = require('../../helpers/db');

describe('helpers/demo.js', () => {
  let demoUser;
  let usualUser;

  before((done) => {
    /** Connect to mongo db */
    mongoose.connect('mongodb://localhost:27017/controlio-test', () => {
      /** Drop mongo db */
      mongoose.connection.db.dropDatabase();
      /** Add a user */
      const demoEmail = 'demo@controlio.co';
      const notdemoEmail = 'notdemo@controlio.co';
      db.addUser({ email: demoEmail, isDemo: true })
        .then((dbdemouser) => {
          demoUser = dbdemouser;
          return db.addUser({ email: notdemoEmail, isDemo: false })
            .then((dbnotdemouser) => {
              usualUser = dbnotdemouser;
              return dbnotdemouser;
            });
        })
        .then(() => done())
        .catch(done);
    });
  });

  after((done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close();
      done();
    });
  });

  it('validates not demo user', (done) => {
    const request = new MockExpressRequest();
    request.user = usualUser;
    demo.checkDemo(request, null, (err) => {
      test.value(err)
        .isUndefined();
      done();
    });
  });

  it('returns an error on demo user', (done) => {
    const request = new MockExpressRequest();
    request.user = demoUser;
    demo.checkDemo(request, null, (err) => {
      test.object(err);
      done();
    });
  });
});
