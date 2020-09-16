import * as qiniu from 'qiniu-js';
import ApolloClientAPI from './ApolloClient/ApolloClientAPI';
import gql from 'graphql-tag';

const QINIU_UPLOAD_TOKEN_STATE = gql`
  {
    qiniu @client {
      success
      message
      data
    }
  }
`;

const QINIU_UPLOAD_TOKEN_QUERY = gql`
  {
    qiniuToken {
      success
      message
      data
    }
  }
`;

const QINIU_BATCH_DELETE_QUERY = gql`
  mutation qiniuBatchDelete($images: [String!]) {
    qiniuBatchDelete(images: $images) {
      success
      message
      data
    }
  }
`;

const QINIU_BATCH_COPY_QUERY = gql`
  mutation qiniuBatchCopy($images: [String!]) {
    qiniuBatchCopy(images: $images) {
      success
      message
      data
    }
  }
`;

const qiniuAPI = async (loadToken = true) => {
  const apolloClient = ApolloClientAPI();
  let qiniuToken = "";
  if (loadToken) {
    qiniuToken = await apolloClient.query(QINIU_UPLOAD_TOKEN_QUERY).then(result=>result).catch(err=>{});
  }
  return {
    upload: async (file) => {
      let fileObj = file.originFileObj
      var config = {
        useCdnDomain: true,
        region: qiniu.region.z0
      };
      var putExtra = {
        fname: "",
        params: {},
        mimeType: ["image/png", "image/jpeg", "image/gif"]
      };
      let key = file.name;
      return new Promise((resolve, reject) => {
        if (qiniuToken) {
          let response = qiniuToken.data.qiniuToken;
          if (response.success) {
            let uploadToken = response.data;
            let observable = qiniu.upload(fileObj, key, uploadToken, putExtra, config)

            observable.subscribe({
              next(res){
                console.log('next(res)',res)
              },
              error(err){
                console.log('error(err)',err)
                reject(err)
              }, 
              complete(res){
                console.log('complete(res)',res)
                resolve(res)
              }
            })
          }
        }
        else {
          reject("Error getting token")
        }
        // apolloClient.query(QINIU_UPLOAD_TOKEN_STATE).then(result=>{
        //   console.log('result',result)
        //   let response = result.data.qiniu;
        //   if (response.success) {
        //     let uploadToken = response.data;
        //     let observable = qiniu.upload(fileObj, key, uploadToken, putExtra, config)
          
        //     observable.subscribe({
        //       next(res){
        //         //console.log('next(res)',res)
        //       },
        //       error(err){
        //         console.log('error(err)',err)
        //         reject(err)
        //       }, 
        //       complete(res){
        //         console.log('complete(res)',res)
        //         resolve(res)
        //       }
        //     })
        //   }
        // }).catch(err=>{
        //   console.log('cached qiniu token not found',err)
          
        //   apolloClient.query(QINIU_UPLOAD_TOKEN_QUERY).then(result2=>{
        //     console.log('result2',result2)
        //     // apolloClient.client.writeQuery({ UPDATE_QINIU_UPLOAD_TOKEN_QUERY, data });
        //     apolloClient.cache.writeData({data: {qiniu:result2.data.qiniuToken}})
        //     let response2 = result2.data.qiniuToken;
        //     if (response2.success) {
        //       let uploadToken = response2.data;
        //       let observable = qiniu.upload(fileObj, key, uploadToken, putExtra, config)
  
        //       observable.subscribe({
        //         next(res){
        //           console.log('next(res)',res)
        //         },
        //         error(err){
        //           console.log('error(err)',err)
        //           reject(err)
        //         }, 
        //         complete(res){
        //           console.log('complete(res)',res)
        //           resolve(res)
        //         }
        //       })
        //     }
        //   }).catch(err2=>{
        //     console.log('err2',err2)
        //     reject(err2)
        //   })
        // })

      })

    },
    batchDelete: async (images) => {
      return new Promise((resolve, reject) => {
        apolloClient.mutation(QINIU_BATCH_DELETE_QUERY,{
          images: images
        })
        .then(result=>resolve(result))
        .catch(err=>{
          console.log(err);
          reject(err)
        });
      })
    },
    batchCopy: async (images) => {
      return new Promise((resolve, reject) => {
        apolloClient.mutation(QINIU_BATCH_COPY_QUERY,{
          images: images
        })
        .then(result=>resolve(result))
        .catch(err=>{
          console.log(err);
          reject(err)
        });
      })
    },

    getFiles: async () => {
      
    },

    imageMogr2: (options, key, domain) => {
      return qiniu.imageMogr2(options, key, domain);
    }
  }
}

export default qiniuAPI;