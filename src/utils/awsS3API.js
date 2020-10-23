import AWS from 'aws-sdk';
import { DefaultClientAPI } from './customHook';
import gql from 'graphql-tag';
import axios from 'axios';

const bucketRegion = 'ap-east-1';
// const IdentityPoolId = 'ap-east-1:bcd5bb0f-792b-40fc-b8cb-20632b3453c1';
const accessKey = process.env.AWSS3_ACCESSKEY;
const secretAccessKey = process.env.AWSS3_SECRETACCESSKEY;


const AWS_GET_SIGNED_URL = gql`
  query getS3SignedUrl($bucketName: String!, $Key: String!, $ContentType: String!) {
    getS3SignedUrl(bucketName: $bucketName, Key: $Key, ContentType: $ContentType) {
      success
      message
      data
    }
  }
`;

const AWS_GET_MANY_SIGNED_URL = gql`
  query getManyS3SignedUrl($bucketName: String!, $objects: [JSONObject!]) {
    getManyS3SignedUrl(bucketName: $bucketName, objects: $objects) {
      success
      message
      data
    }
  }
`;

const AWS_DELETE_ONE = gql`
  mutation s3DeleteOne($bucketName: String!, $Key: String!) {
    s3DeleteOne(bucketName: $bucketName, Key: $Key) {
      success
      message
      data
    }
  }
`;

const AWS_DELETE_MANY = gql`
  mutation s3DeleteMany($bucketName: String!, $Keys: [String!]) {
    s3DeleteMany(bucketName: $bucketName, Keys: $Keys) {
      success
      message
      data
    }
  }
`;


const awsS3API = (bucketName=null) => {
  // AWS.config.region = bucketRegion; 
  // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  //   IdentityPoolId: IdentityPoolId
  // });

  AWS.config.update({
    region: bucketRegion,
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey
  });

  let s3 = new AWS.S3({
    region: bucketRegion,
    apiVersion: "2006-03-01",
    //params: { Bucket: albumBucketName },
    maxRetries: 3
  });
  
  if (!bucketName) {
    return {}
  }


  return {
    getImages: async () => {
      return new Promise((resolve, reject) => {
        var params = {
          Bucket: bucketName, 
          //MaxKeys: 2
         };
         s3.listObjects(params, function(err, data) {
          if (err) {
            // console.log("Error", err);
            reject(err);

          } else {
            // console.log("Success", data);
            resolve(data)
          }
        })
      })
    },

    getSignedUrl: async (Key, ContentType) => {
      return new Promise((resolve, reject) => {
        DefaultClientAPI.query(AWS_GET_SIGNED_URL,{
          bucketName, Key, ContentType
        })
        .then(result=>resolve(result))
        .catch(err=>{
          console.log(err);
          reject(err)
        });
      })
    },

    getManySignedUrl: async (files) => {
      let objects = files.map((aFile)=>{
        return {
          Key: aFile.name,
          ContentType: aFile.type
        }
      })
      return new Promise((resolve, reject) => {
        DefaultClientAPI.query(AWS_GET_MANY_SIGNED_URL,{
          bucketName, objects
        })
        .then(result=>resolve(result))
        .catch(err=>{
          console.log(err);
          reject(err)
        });
      })
    },

    uploadOneWithURL: async (url, file) => {
      return new Promise((resolve, reject) => {
        axios
        .put(url, file.originFileObj, {
          'Content-Type': file.type
        })
        .then(res => {
          // console.log('Upload Successful',res)
          resolve(res);
        })
        .catch(err => {
          // console.log('Sorry, something went wrong')
          reject(err)
        });
      })
    },

    uploadManyWithURL: async (requestObjs) => {
      let requests = []
      requestObjs.forEach((anObj)=>{
        requests.push(
          axios.put(
            anObj.url, 
            anObj.file.originFileObj, 
            {
              'Content-Type': anObj.file.type
            }
          )
        )
      });

      return new Promise((resolve, reject) => {
        axios.all(requests).then(axios.spread((...responses) => {
          resolve(responses);
        })).catch(errors=>{
          reject(errors)
        })
      })
    },

    deleteOne: async (Key) => {
      return new Promise((resolve, reject) => {
        // let x = DefaultClientAPI.mutation(AWS_DELETE_ONE,{
        //   bucketName, Key
        // })
        // console.log('AWS_DELETE_ONE', x)
        // resolve('deleted')
        DefaultClientAPI.mutation(AWS_DELETE_ONE,{
          bucketName, Key
        })
        .then(result=>resolve(result))
        .catch(err=>{
          console.log(err);
          reject(err)
        });
      })
    },

    deleteMany: async (files) => {
      let Keys = files.map((aFile)=>{
        return aFile.name
      })
      return new Promise((resolve, reject) => {
        DefaultClientAPI.mutation(AWS_DELETE_MANY,{
          bucketName, Keys
        })
        .then(result=>resolve(result))
        .catch(err=>{
          console.log(err);
          reject(err)
        });
      })
    },
  }

}

export default awsS3API;