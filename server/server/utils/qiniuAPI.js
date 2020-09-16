import qiniu from 'qiniu';
const dotenv = require('dotenv');
dotenv.config();

const qiniuAPI = (bucketName = null) => {
  // store keys outside
  const accessKey = process.env.QINIU_ACCESSKEY;
  const secretKey = process.env.QINIU_SECRETKEY;
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

  // bucket based on userId
  const srcBucket = bucketName;

  return {
    getToken: () => {
      const options = {
        scope: srcBucket,
        expires: 3600 * 24
        //returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
        //callbackBodyType: 'application/json'
      };
      const putPolicy = new qiniu.rs.PutPolicy(options);
      const uploadToken = putPolicy.uploadToken(mac);
      let response = {
        success: false,
        message: "Failed to get token",
        data: {}
      };
    
      if (uploadToken) {
        response = {
          success: true,
          message: "Get token success",
          data: uploadToken
        }
      }
      return response;
    },
    batchDelete: async (images) => {
      var config = new qiniu.conf.Config();
      config.zone = qiniu.zone.Zone_z0;
      var bucketManager = new qiniu.rs.BucketManager(mac, config);

      let deleteOperations = [];
      images.map((anImage)=>{
        deleteOperations.push(
          qiniu.rs.deleteOp(srcBucket, anImage)
        )
      })

      return new Promise((resolve, reject) => {
        if (deleteOperations.length > 0) {
          bucketManager.batch(deleteOperations, function(err, respBody, respInfo) {
            if (err) {
              reject({
                success: false,
                message: "Failed to delete",
                data: {}
              })
            } else {
              // 200 is success, 298 is part success
              if (parseInt(respInfo.statusCode / 100) == 2) {
                respBody.forEach(function(item) {
                  if (item.code == 200) {
                    console.log(item.code + "\tsuccess");
                  } else {
                    console.log(item.code + "\t" + item.data.error);
                  }
                });
                resolve({
                  success: true,
                  message: "All deleted",
                  data: {}
                })
              } else {
                reject({
                  success: false,
                  message: "Something wrong during delete but jobs completed",
                  data: {}
                })
              }
            }
          });
        }
        else {
          reject({
            success: false,
            message: "No images found",
            data: {}
          })
        }
      })

    },
    batchCopy: async (images, targetBucket) => {
      var config = new qiniu.conf.Config();
      config.zone = qiniu.zone.Zone_z0;
      var bucketManager = new qiniu.rs.BucketManager(mac, config);

      let copyOperations = [];
      // images.map((anImage)=>{
      //   copyOperations.push(
      //     qiniu.rs.copyOp(srcBucket, anImage, targetBucket, anImage)
      //   )
      // })

      // copyOperations.push(qiniu.rs.copyOp(srcBucket,'saas_logo_1593164963911_100105745_703803090422350_7103922744202362880_n.jpg',targetBucket,'saas_logo_1593164963911_100105745_703803090422350_7103922744202362880_n.jpg'))
      copyOperations = [
        //qiniu.rs.copyOp(srcBucket, 'avatar.jpg', targetBucket, 'avatar.jpg'),
        qiniu.rs.copyOp(srcBucket, 'saas_logo_1592972996850_klkl-logo.jpg', targetBucket, 'saas_logo_1592972996850_klkl-logo.jpg'),
        //qiniu.rs.copyOp(srcBucket, 'saas_payment_1593523883680_未命名_副本.jpg', targetBucket, 'saas_payment_1593523883680_未命名_副本.jpg'),
      ]

      return new Promise((resolve, reject) => {
        bucketManager.listPrefix('klklvapor-3',{},function(err, respBody, respInfo) {
          if (err) {
            console.log(err);
            throw err;
          }
          if (respInfo.statusCode == 200) {
            //如果这个nextMarker不为空，那么还有未列举完毕的文件列表，下次调用listPrefix的时候，
            //指定options里面的marker为这个值
            // var nextMarker = respBody.marker;
            // var commonPrefixes = respBody.commonPrefixes;
            // console.log(nextMarker);
            // console.log(commonPrefixes);
            var items = respBody.items;
            console.log('total length: ',items.length)
            console.log('link 1 ',"http://qefdx54gk.bkt.clouddn.com/"+items[0].key)

            items.forEach(function(item) {
              console.log(item.key);
              // console.log(item.putTime);
              // console.log(item.hash);
              // console.log(item.fsize);
              // console.log(item.mimeType);
              // console.log(item.endUser);
              // console.log(item.type);
            });
            resolve({
              success: true,
              message: "All copied",
              data: {items}
            })
          } else {
            console.log(respInfo.statusCode);
            console.log(respBody);
          }
        });
        // if (copyOperations.length > 0) {
        //   bucketManager.batch(copyOperations, function(err, respBody, respInfo) {
        //     if (err) {
        //       reject({
        //         success: false,
        //         message: "Failed to copy",
        //         data: {}
        //       })
        //     } else {
        //       // 200 is success, 298 is part success
        //       if (parseInt(respInfo.statusCode / 100) == 2) {
        //         respBody.forEach(function(item) {
        //           if (item.code == 200) {
        //             console.log(item.code + "\tsuccess");
        //           } else {
        //             console.log(item.code + "\t" + item.data.error);
        //           }
        //         });
        //         resolve({
        //           success: true,
        //           message: "All copied",
        //           data: {respBody}
        //         })
        //       } else {
        //         reject({
        //           success: false,
        //           message: "Something wrong during copy but jobs completed",
        //           data: {}
        //         })
        //       }
        //     }
        //   });
        // }
        // else {
        //   reject({
        //     success: false,
        //     message: "No images found",
        //     data: {}
        //   })
        // }

      })

    }
  }
}

export default qiniuAPI;