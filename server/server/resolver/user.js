import { AuthenticationError, ApolloError } from 'apollo-server-express';
import UserModel from '../model/user';
import { createPassword } from '../utils/password';
import { setAuthCookies, deleteAuthCookies } from "../utils/token";

const authenticate = role => resolver => {
  return (parent, args, context, info) => {
    if (context.user && (!role || context.user.role === role)) {
      return resolver(parent, args, context, info)
    } else {
      throw new AuthenticationError('Unauthorized')
    }
  }
}

const adminsOnly = authenticate('ADMIN')

const resolvers = {
    Query: {
      users: adminsOnly( async (_, args={}, context) => {
        const db_base = await global.connection.useDb("base");
        const collection_user = await db_base.model("User",UserModel.schema,'user');

        return await collection_user.getUsers(args);
      }),
      user: async (_, args={}, context) => {
        const db_base = await global.connection.useDb("base");
        const collection_user = await db_base.model("User",UserModel.schema,'user');

        return await collection_user.findOne(args);
      },
      loggedInUser: async (_, args={}, { req }) => {
        // if (!req.user) throw new AuthenticationError("Must authenticate");
        if (req.user && req.user._id) {
          const db_base = await global.connection.useDb("base");
          const collection_user = await db_base.model("User",UserModel.schema,'user');
          // return await collection_user.findOneUser({username: req.user.username});
          return await collection_user.findOneUser({_id: req.user._id});
        }
        else {
          return {
            success: false,
            message: "no user logged in",
            data: null
          }
          // return new ApolloError("User not found");

        }
      }
    },
    Mutation: {
      createUser: async (_, args={}, { req }) => {
        const db_base = await global.connection.useDb("base");
        const collection_user = await db_base.model("User",UserModel.schema,'user');

        let hashPassword = createPassword(args.user.password);
        const newUserObj = Object.assign({},args.user,{password: hashPassword, configId: "", tokenCount: 0, role: "TENANT"});
        
        let createResult = await collection_user.findOneOrCreate(newUserObj);

        // create qiniu bucket, create config
        return createResult;
      },
      // loginUser: async (_, args={}, context) => {
      //   console.log("loginUser",args)
      //   const { user, info } = await context.authenticate("graphql-local", {
      //     username: args.user.username,
      //     password: args.user.password
      //   });
      //   console.log("loginUser2",user)
      //         // only required if express-session is used
      //   context.login(user);
  
      //   return {
      //     success: true,
      //     message: "logged in",
      //     data: user
      //   };
      // },

      changeUserPassword: async (_, args={}, { req }) => {
        const db_base = await global.connection.useDb("base");
        const collection_user = await db_base.model("User",UserModel.schema,'user');
        let newHashPassword = createPassword(args.password);
        // let updateResult = await collection_user.findOneAndUpdate({_id: args._id}, {password: newHashPassword})
        let response = {
          success: false,
          message: "",
          data: {}
        }
        await collection_user.findOneAndUpdate({_id: args._id}, {password: newHashPassword}).then((res)=>{
          response = {
            success: true,
            message: "Change Password Success",
            data: {}
          }
        }).catch(err => {
          response = {
            success: false,
            message: "Change Password Error",
            data: {}
          }
        })
        return response;
      },
      login: async (_, args={}, { res }) => {
        const db_base = await global.connection.useDb("base");
        const collection_user = await db_base.model("User",UserModel.schema,'user');

        let username = { username: args.user.username }
        let userFoundResult = await collection_user.findOneUser(username);
        if (userFoundResult.success) {
            const isValidPassword = await userFoundResult.data.validatePassword(args.user.password);
            if (isValidPassword) {
                let tokenData = JSON.parse(JSON.stringify(userFoundResult.data));
     
                await setAuthCookies(res, {
                  _id: tokenData._id,
                  username: tokenData.username,
                  role: tokenData.role,
                  configId: tokenData.configId,
                  tokenCount: tokenData.tokenCount
                })

                return userFoundResult;
            }
            else {
                return {
                    success: false,
                    message: "Failed to validate password",
                    data: null
                }
            }
        }
        return userFoundResult;
      },
      login2: async (_, { username, password }, { res }) => {
        const db_base = await global.connection.useDb("base");
        const collection_user = await db_base.model("User",UserModel.schema,'user');

        let userFoundResult = await collection_user.findOneUser({ username: username });
        if (userFoundResult.success) {
            const isValidPassword = await userFoundResult.data.validatePassword(password);
            if (isValidPassword) {
                let tokenData = JSON.parse(JSON.stringify(userFoundResult.data));
                await setAuthCookies(res, {
                  _id: tokenData._id,
                  username: tokenData.username,
                  role: tokenData.role,
                  configId: tokenData.configId,
                  tokenCount: tokenData.tokenCount
                })

                return userFoundResult;
            }
            else {
                return {
                    success: false,
                    message: "Failed to validate password",
                    data: null
                }
            }
        }
        return userFoundResult;
      },
      logout: async (_, args={}, { req, res }) => {
        deleteAuthCookies(res, "TENANT");
        
        return {
          success: true,
          message: "Logout Success",
          data: null
        }
      },
      invalidateTokens: async (_, __, { req }) => {
        if (!req.user) {
          return false;
        }
  
        const db_base = await global.connection.useDb("base");
        const collection_user = await db_base.model("User",UserModel.schema,'user');

        let username = { username: req.user._id }
        let userFoundResult = await collection_user.findOneUser(username);

        if (!userFoundResult || !userFoundResult.success) {
          return false;
        } 

        await collection_user.findOneAndUpdate({_id: userFoundResult.data._id}, { $inc: {tokenCount: 1} });

        // const user = await User.findOne(req.userId);
        // if (!user) {
        //   return false;
        // }
        // user.count += 1;
        // await user.save();
  
        // res.clearCookie('access-token')
  
        return true;
      }

        
    }
    
};

export default resolvers;
