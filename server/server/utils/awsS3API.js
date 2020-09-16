import AWS from 'aws-sdk';
const dotenv = require('dotenv');
dotenv.config();

const albumBucketName = "mananml";

const awsS3API = async (bucketName, bucketRegion='ap-east-1', accessKey2, secretAccessKey2) => {
  const accessKey = process.env.AWSS3_ACCESSKEY;
  const secretAccessKey = process.env.AWSS3_SECRETACCESSKEY;
  const IdentityPoolId = process.env.AWSS3_IDENTITYPOOLID;

  // AWS.config.region = bucketRegion; 
  // AWS.config.credentials = new AWS.CognitoIdentityCredentials({IdentityPoolId: IdentityPoolId});

  AWS.config.update({
    region: bucketRegion,
    //credentials: new AWS.CognitoIdentityCredentials({IdentityPoolId: IdentityPoolId}),
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey
  });

  let s3 = new AWS.S3({
    region: bucketRegion,
    //Bucket: bucketName,
    apiVersion: "2006-03-01",
    //accessKeyId: accessKey,
    //secretAccessKey: secretAccessKey,
    maxRetries: 3
  });

  return {
    getImages: async (bucketName) => {
      let bucketParams = {
        Bucket: bucketName
      }
      return new Promise((resolve, reject) => {
        s3.listObjects(bucketParams, function(err, data) {
          if (err) {
            console.log("Error", err);
            reject(err);
          } else {
            console.log("Success", data);
            resolve(data.Contents)
          }
        });
      })
      
    },

    generatePutUrl: async (bucketName, Key, ContentType) => {
      let params = {
        Bucket: bucketName,
        Key: Key, 
        ACL: 'public-read',
        ContentType: ContentType,
        Expires: 30 * 60,
      }
      return new Promise((resolve, reject) => {
        // Note operation in this case is putObject
        s3.getSignedUrl('putObject', params, function(err, url) {
          if (err) {
            reject(err);
          }
          // If there is no errors we can send back the pre-signed PUT URL
          resolve(url);
        });
      });
    },

    generateManyPutUrl: async (bucketName, objects) => {

      const runOne = (params) => {
        return new Promise((resolve, reject) => {
          // Note operation in this case is putObject
          s3.getSignedUrl('putObject', params, function(err, url) {
            if (err) {
              reject(err);
            }
            // If there is no errors we can send back the pre-signed PUT URL
            resolve({name: params.Key, url});
          });
        });
      }

      return new Promise((resolve, reject) => {
        Promise.all(
          objects.map(async anObject => {
            let params = {
              Bucket: bucketName,
              Key: anObject.Key, 
              ACL: 'public-read',
              ContentType: anObject.ContentType,
              Expires: 30 * 60,
            }
            return runOne(params)
          })
        ).then((result)=>{
          resolve(result)
        }).catch(err=>{
          reject(err)
        })
      });
    },

    deleteOne: async (bucketName, Key) => {
      let deleteParams = {
        Bucket: bucketName, 
        Key: Key
       };

       return new Promise((resolve, reject) => {
         s3.deleteObject(deleteParams, function(err, data) {
          if (err) {
            reject(err);
          }
          // If there is no errors we can send back the data
          resolve(data);
         });
       })
    },
    deleteMany: async (bucketName, Keys = []) => {

      let keyObjects = Keys.map((aKey)=>{
        return {
          Key: aKey
        }
      })

      let deleteParams = {
        Bucket: bucketName, 
        Delete: {
          Objects: keyObjects, 
          Quiet: false
        }
       };

       return new Promise((resolve, reject) => {
         s3.deleteObjects(deleteParams, function(err, data) {
          if (err) {
            reject(err);
          }
          // If there is no errors we can send back the data
          resolve(data);
         });
       });

    },
    
    uploadOne: (bucketName, name, file) => {
      let uploadParams = {
        Bucket: bucketName,
        Key: name, 
        Body: file
      }
      return new Promise((resolve, reject) => {
        s3.upload(uploadParams, function (err, data) {
          if (err) {
            console.log("Error", err);
            reject(err)
          } if (data) {
            console.log("Upload Success", data.Location);
            resolve(data)
          }
        });
      })
    },
    
    
  }

}

export default awsS3API;

// {
//   "Version": "2012-10-17",
//   "Statement": [
//       {
//           "Sid": "AddCannedAcl",
//           "Effect": "Allow",
//           "Principal": {
//               "AWS": "arn:aws:iam::713471671691:user/pwg_saas"
//           },
//           "Action": [
//               "s3:GetObject",
//               "s3:PutObject",
//               "s3:PutObjectAcl"
//           ],
//           "Resource": "arn:aws:s3:::mananml/*"
//       }
//   ]
// }