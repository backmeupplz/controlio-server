const test = require('unit.js');
const helper = require('../helper');
const db = require('../../helpers/db');
const config = require('../../config');

describe('routes/posts.js', function () {
  let ownerEmail = 'owner@controlio.co';
  let owner;
  let clientEmail = 'cleint@controlio.co';
  let client;
  let managerEmail = 'manager@controlio.co';
  let manager;
  let project;
  let post;

  before(function (done) {
    this.timeout(5000);
    helper.closeConnectDrop()
      .then(() => Promise.all([
        db.addUser({ email: ownerEmail }).then(helper.generateJWT),
        db.addUser({ email: clientEmail }).then(helper.generateJWT),
        db.addUser({ email: managerEmail }).then(helper.generateJWT),
      ]))
      .then((users) => {
        owner = users[0];
        client = users[1];
        manager = users[2];
        done();
      })
      .catch(done);
  });
  after(function (done) {
    helper.dropClose()
      .then(done)
      .catch(done);
  });

  it('creates a project', function (done) {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', owner.token)
      .send({
        title: 'Test posts',
        type: 'manager',
        clientEmails: [clientEmail],
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json);
            project = json;
            done();
          } catch (error) {
            done(error);
          }
      });
  });
  it('adds a manager to the project', function (done) {
    db.getProject(owner._id, project._id)
      .then((dbproject) => {
        dbproject.managers.push(manager._id);
        return dbproject.save()
          .then((savedProject) => {
            project = savedProject.toObject();
            test.object(project);
            done();
          });
      })
      .catch(done);
  });

  context('POST /posts', function () {
    it('correctly posts post as owner', function (done) {
      helper.request
        .post('/posts')
        .set('apiKey', config.apiKey)
        .set('token', owner.token)
        .send({
          projectid: String(project._id),
          text: 'one',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('text', 'one')
              .hasProperty('author', String(owner._id))
              .hasProperty('isEdited', false)
              .hasProperty('type', 'post');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  it('refreshes project', function (done) {
    db.getProject(owner._id, project._id)
      .then((dbproject) => {
        project = dbproject;
        done();
      })
      .catch(done);
  });

  context('GET /posts', function () {
    it('correctly gets posts as owner', function (done) {
      helper.request
        .get('/posts')
        .set('apiKey', config.apiKey)
        .set('token', owner.token)
        .query({
          projectid: String(project._id),
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(1);
            post = json[0];
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('PUT /posts', function () {
    it('correctly edits posts as owner', function (done) {
      helper.request
        .put('/posts')
        .set('apiKey', config.apiKey)
        .set('token', owner.token)
        .send({
          projectid: String(project._id),
          postid: String(post._id),
          text: 'two',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('text', 'two')
              .hasProperty('author', String(owner._id))
              .hasProperty('isEdited', true)
              .hasProperty('type', 'post');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('DELETE /posts', function () {
    it('correctly edits posts as owner', function (done) {
      helper.request
        .delete('/posts')
        .set('apiKey', config.apiKey)
        .set('token', owner.token)
        .send({
          projectid: String(project._id),
          postid: String(post._id),
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('success', true);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });
});
