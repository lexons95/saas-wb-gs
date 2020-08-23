import { combineResolvers, skip } from 'graphql-resolvers';
import { AuthenticationError } from "apollo-server-express";
import { setAuthCookies, getAuthCookies, validateAccessToken, validateRefreshToken } from "./token";
import UserModel from '../model/user';

const reqUserKey = 'user';

// validate token and find user using the token from request headers for every request from client
export const validateTokensMiddleware = async (req, res, next) => {

    let cookieKey = 'TENANT';
    let accessCookieLabel = 'saas-access-' + cookieKey; 
    let refreshCookieLabel = 'saas-refresh-' + cookieKey;

    const accessToken = req.cookies[accessCookieLabel];
    const refreshToken = req.cookies[refreshCookieLabel];

    if (!accessToken && !refreshToken) return next();

    const decodedAccessToken = validateAccessToken(accessToken);
    if (decodedAccessToken && decodedAccessToken.data) {

        req[reqUserKey] = decodedAccessToken.data;

        return next();
    }

    const decodedRefreshToken = validateRefreshToken(refreshToken);

    if (!refreshToken) {
        return next();
    }

    if (!decodedRefreshToken) {
        return next();
    }

    const db_base = await global.connection.useDb("base");
    const collection_user = await db_base.model("User",UserModel.schema,'user');
    let findUserResult = await collection_user.findOneUser({_id: decodedRefreshToken.data._id});

    let user = null;
    if (findUserResult.success && findUserResult.data) {
        user = findUserResult.data;
    }
    
    // valid user and user token not invalidated
    if (!user || (user.tokenCount !== decodedRefreshToken.data.tokenCount))
    return next();

    // be aware that sometimes the obj property value will somehow be undefined (unknown issue)
    user = JSON.parse(JSON.stringify(user))
    // refresh the tokens
    let cookies = setAuthCookies(res, {
        _id: user._id,
        username: user.username,
        role: user.role,
        configId: user.configId,
        tokenCount: user.tokenCount
    })

    req[reqUserKey] = user;

    next();
}

// // check logged in or not
// export const isAuthenticated = async (_, args={}, { req }) => {
//     return req.user ? skip : new AuthenticationError('Not authenticated as user.');
// }
  
// // check if the logged in user is admin
// export const isAdmin = combineResolvers(
//     isAuthenticated,
//     (_, args={}, { req }) => {
//         let userObj = req.user;
//         return userObj.role == 'ADMIN'
//             ? skip
//             : new AuthenticationError('Not authorized as admin.')
//     }
// );

export const requiresRole = roles => resolver => {
    return (parent, args, context, info) => {
        //if (context.req.user && (!roles || roles.indexOf(context.req.user.role) >= 0)) {
        if (context.req.user && context.req.user._id && (!roles || roles.indexOf(context.req.user.role) >= 0)) {
            return resolver(parent, args, context, info)
        } else {
            // return {
            //     success: false,
            //     message: "Unauthorized",
            //     data: {}
            // }
            throw new AuthenticationError('Unauthorized')
        }
    }
}

export const tenantOnly = requiresRole(['TENANT'])
export const editorOnly = requiresRole(['TENANT', 'ADMIN', 'SUBTENANT'])

//   const membersOnly = requiresRole('MEMBER')
//   const adminsOnly = requiresRole('ADMIN')
//   const requiresLogin = requiresRole(null)