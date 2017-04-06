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
      mongoose.connection.db.dropDatabase(done);
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

  it('returns reset password page with token', (done) => {
    user.generateResetPasswordToken();
    user.save()
      .then((saved) => {
        request(app)
          .get(`/public/resetPassword?token=${saved.tokenForPasswordReset}`)
          .expect(200, (error, res) => {
            if (error) return done(error);

            test.string(res.text)
              .contains(saved.tokenForPasswordReset);
            done();
          });
      })
      .catch(done);
  });
  it('returns error when reset password token not provided', (done) => {
    request(app)
      .get('/public/resetPassword')
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
  it('returns error when reset password token malformed', (done) => {
    request(app)
      .get('/public/resetPassword?token=123')
      .expect(200, (error, res) => {
        if (error) return done(error);
        try {
          test.string(res.text)
            .contains('jwt malformed');
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns error on second view of the reset password', (done) => {
    user.generateResetPasswordToken();
    user.save()
      .then((saved) => {
        request(app)
          .get(`/public/resetPassword?token=${saved.tokenForPasswordReset}`)
          .end(() => {
            request(app)
              .get(`/public/resetPassword?token=${saved.tokenForPasswordReset}`)
              .expect(200, (error, res) => {
                if (error) return done(error);

                test.string(res.text)
                  .contains('You can only use reset link once');
                done();
              });
          });
      })
      .catch(done);
  });
});
