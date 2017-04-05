const test = require('unit.js');
const hash = require('../../helpers/hash');

describe('helpers/hash.js', () => {
  const correctPass = 'correct';
  const wrongPass = 'wrong';
  let correcthash;

  before((done) => {
    hash.hashPassword(correctPass)
      .then((result) => {
        correcthash = result;
        done();
      })
      .catch(done);
  });

  it('correctly hashes the password', (done) => {
    hash.hashPassword(correctPass)
      .then((result) => {
        test.string(result);
        done();
      })
      .catch(done);
  });
  it('correctly checks the password', (done) => {
    hash.checkPassword(correcthash, correctPass)
      .then(result => {
        if (result) {
          done();
        } else {
          done(new Error('Couldn\'t verify hash'));
        }
      })
      .catch(done);
  });
  it('gives false on wrong password', (done) => {
    hash.checkPassword(correcthash, wrongPass)
      .then(result => {
        if (result) {
          done(new Error('Accepted wrong password'));
        } else {
          done();
        }
      })
      .catch(done);
  });
});
