const test = require('unit.js');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const request = require('supertest');
const app = require('../../app');
const db = require('../../helpers/db');

describe('routes/public.js', () => {
  let email = 'test@controlio.co';
  let user;
  before((done) => {
    /** Connect to mongo db */
    mongoose.connect('mongodb://localhost:27017/controlio-test', (err) => {
      if (err) return done(err);
      /** Drop mongo db */
      mongoose.connection.db.dropDatabase();
      done();
    });
  });
  after((done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close();
      done();
    });
  });
  beforeEach((done) => {
    db.addUser({ email })
      .then((dbuser) => {
        user = dbuser;
        done();
      })
      .catch(done);
  });
  afterEach((done) => {
    mongoose.connection.db.dropDatabase(done);
  });

  it('renders reset password page', (done) => {
    request(app)
      .get('public/resetPassword?token=check_token')
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
});
