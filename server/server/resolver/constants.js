import { AuthenticationError, ApolloError } from 'apollo-server-express';
import qiniuAPI from '../utils/qiniuAPI';
import { editorOnly } from '../utils/authentication';
import awsS3API from '../utils/awsS3API';

const resolvers = {
  Query: {
    userConfig: async (_, args={}, context) => {
      let dbName = args.configId;
      const db_base = await global.connection.useDb("base"); 
      const collection_config = await db_base.collection("config");
      let response = {
        success: false,
        message: "user config id not found",
        data: {}
      }
      let foundResult = await collection_config.findOne({configId: dbName})
      if (foundResult) {
        return {
          success: true,
          message: "config found",
          data: foundResult
        }
      }
      else {
        return new ApolloError("Config not found");
      }
    },
    qiniuToken: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;
      let dbName = loggedInUser && loggedInUser.configId ? loggedInUser.configId : null;
      const db_base = await global.connection.useDb("base"); 
      const collection_config = await db_base.collection("config");
      if (dbName) {
        let foundConfigResult = await collection_config.findOne({configId: dbName});
        if (foundConfigResult) {
          let bucketName = foundConfigResult.bucketName;
          let getTokenResult = qiniuAPI(bucketName).getToken();
          if (getTokenResult.success) {
            return getTokenResult;
          }
          else {
            return new ApolloError("Failed to get token");
          }
        }
        else {
          return new ApolloError("Failed to get config");
        }
      }
      else {
        return new ApolloError("Failed to get token");
      }
    }),
    getS3SignedUrl: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;
      let dbName = loggedInUser && loggedInUser.configId ? loggedInUser.configId : args.configId;
      if (dbName) {
        let AWSS3API = await awsS3API();
        let urlResult = await AWSS3API.generatePutUrl(dbName, args.Key, args.ContentType)
        return {
          success: true,
          message: "URL generated",
          data: urlResult
        }
      }
      return new ApolloError("Config not found");
    }),
    getManyS3SignedUrl: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;
      let dbName = loggedInUser && loggedInUser.configId ? loggedInUser.configId : args.configId;
      if (dbName) {
        let AWSS3API = await awsS3API();
        let urlResult = await AWSS3API.generateManyPutUrl(dbName, args.objects)
        return {
          success: true,
          message: "URL generated",
          data: urlResult
        }
      }
      return new ApolloError("Config not found");
    })
  },
  Mutation: {
    qiniuBatchDelete: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;
      let dbName = loggedInUser && loggedInUser.configId ? loggedInUser.configId : null;
      const db_base = await global.connection.useDb("base"); 
      const collection_config = await db_base.collection("config");
      if (dbName) {
        let foundConfigResult = await collection_config.findOne({configId: dbName});
        if (foundConfigResult) {
          let bucketName = foundConfigResult.bucketName;
          let batchDeleteResult = await qiniuAPI(bucketName).batchDelete(args.images).then(result=>{
            return result
          }).catch(err=>{
            console.log('batchDeleteResult err',err)
          });
          if (batchDeleteResult) {
            return batchDeleteResult;
          }
          else {
            return new ApolloError("Failed to delete");
          } 
        }
        else {
          return new ApolloError("Failed to get config");
        }
      }
      else {
        return new ApolloError("Failed to get token");
      }
    }),
    qiniuBatchCopy: editorOnly( async (_, args={}, { req }) => {
      const { user } = req;
      let loggedInUser = user ? user._id : null;
      //let dbName = loggedInUser && loggedInUser.configId ? loggedInUser.configId : null;
      let dbName = 'klklvapor';
      // let newBucketName = args.targetBucketName;
      // let newBucketName = "mananml-3";
      let newBucketName = "klklvapor-3";
      const db_base = await global.connection.useDb("base"); 
      const collection_config = await db_base.collection("config");
      if (dbName) {
        let foundConfigResult = await collection_config.findOne({configId: dbName});
        if (foundConfigResult) {
          let bucketName = foundConfigResult.bucketName;
          let batchCopyResult = await qiniuAPI(bucketName).batchCopy(args.images, newBucketName).then(result=>{
            return result
          }).catch(err=>{
            console.log('batchCopyResult err',err)
          });
          if (batchCopyResult) {
            return batchCopyResult;
          }
          else {
            return new ApolloError("Failed to delete");
          } 
        }
        else {
          return new ApolloError("Failed to get config");
        }
      }
      else {
        return new ApolloError("Failed to get token");
      }
    }),

    s3UploadOne: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;
      let dbName = loggedInUser && loggedInUser.configId ? loggedInUser.configId : args.configId;
      if (dbName) {
        let AWSS3API = await awsS3API();
        let uploadResult = await AWSS3API.uploadOne(dbName, args.name, args.file)
        uploadResult.then(result=>{
          return result;
        }).catch(err=>{
          console.log('Upload err',err)
          return new ApolloError("Upload failed");
        });
      }
      return new ApolloError("Config not found");
    }),
    s3DeleteOne: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;

      let dbName = loggedInUser && loggedInUser.configId ? loggedInUser.configId : args.configId;
      if (dbName) {
        let AWSS3API = await awsS3API();
        let deleteResult = await AWSS3API.deleteOne(dbName, args.Key);
        return {
          success: true,
          message: "Object deleted",
          data: deleteResult
        }
      }
      return new ApolloError("Config not found");
    }),
    s3DeleteMany: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;

      let dbName = loggedInUser && loggedInUser.configId ? loggedInUser.configId : args.configId;
      if (dbName) {
        let AWSS3API = await awsS3API();
        let deleteResult = await AWSS3API.deleteMany(dbName, args.Keys);
        return {
          success: true,
          message: "Objects deleted",
          data: deleteResult
        }
      }
      return new ApolloError("Config not found");
    }),
    updateConfig: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;
      let dbName = loggedInUser && loggedInUser.configId ? loggedInUser.configId : args.configId;
      if (dbName) {
        const db_base = await global.connection.useDb("base"); 
        const collection_config = await db_base.collection("config");
        let filter = {configId: dbName};
        let setter = {
          $set: args.config
        }
        let foundResult = await collection_config.findOneAndUpdate(filter, setter, {
          returnOriginal: false
        })
        if (foundResult) {
          return {
            success: true,
            message: "config found",
            data: foundResult
          }
        }
      }
      return new ApolloError("Config not found");
      
    }),
  }
};

export default resolvers;
