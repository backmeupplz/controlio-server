const AWS = require('aws-sdk');
const fs = require('fs');

/**
  * class BucketService
  * @property {bucketName}
  * @property {bucket}
  * @property {s3}

  Sample:
  new BucketService({
    identy: "us-east-1:16327515-a666-4f4b-b7b9-d7c831b285c0",
    region: "us-east-1",
    bucketName: 'controlio',
  })
*/
class BucketService {

  /**
   * Constructor
   * @param {Object} { bucketName, identy, region }
   */
  constructor(obj) {
    this.bucketName = obj.bucketName;
    const credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: obj.identy,
    });
    AWS.config.update({
      credentials,
      region: obj.region,
    });
    this.bucket = new AWS.S3({ params: { Bucket: this.bucketName } });
    this.s3 = new AWS.S3();
  }

  /**
   * Upload file on server
   * @param {String} key for AWS s3
   * @param {File} file
   */
  upload(key, file) {
    return new Promise((resolve, reject) => fs.readFile(file.path, (err, data) => {
      if (err) {
        reject({ type: 'FILE_NOT_READ' });
        return;
      }
      if (file === undefined) {
        reject({ type: 'FILE_NOT_SET' });
        return;
      }
      if (key.length <= 0) {
        reject({ type: 'KEY_NOT_SET' });
        return;
      }
      const params = { Key: key, Body: data };
      this.bucket.upload(params, (err, data) => {
        fs.unlink(file.path, function (err) {
          if (err) {
            console.error(err);
          }
        });
        if (!err) resolve(data);
        else reject(err);
      });
    }));
  }

  /**
   * Download file from server
   * @param {File} file
   */
  download(key) {
    return new Promise((resolve, reject) => {
      if (key.length <= 0) {
        reject({ type: 'KEY_NOT_SET' });
        return;
      }
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };
      this.s3.getObject(params, (err, data) => {
        if (!err) resolve(data);
        else reject(err);
      });
    });
  }
}

function create(obj) {
  return new BucketService(obj);
}

module.exports = {
  create,
};
