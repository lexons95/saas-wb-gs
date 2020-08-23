import { sign, verify } from "jsonwebtoken";
const dotenv = require('dotenv');
dotenv.config();

const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY;
const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY;

const accessTokenHeaderLabel = "saas-access-TENANT";
const refreshTokenHeaderLabel = "saas-refresh-TENANT";

export const createToken = async (obj, expiresIn=null) => {
    // const sevenDays = 60 * 60 * 24 * 7 * 1000;
    // const mins_30 = 60 * 30 * 1000;

    const accessDuration = '15m'; // 30 min
    const refreshDuration = '7d'; // 7 days

    let expiresInResult = expiresIn ? expiresIn : accessDuration;

    const accessToken = await sign(
        { data: obj },
        ACCESS_TOKEN_KEY,
        { expiresIn: expiresInResult }
    )
    const refreshToken = await sign(
        { data: obj },
        REFRESH_TOKEN_KEY,
        { expiresIn: refreshDuration }
    )
    return { accessToken, refreshToken };
}

export const tokenCookies = ({ accessToken, refreshToken }) => {
    const cookieOptions = {
        httpOnly: true,
        // secure: true, //for HTTPS only
        // domain: "your-website.com",
        // promo_shown: 1,
        // secure: true,
        sameSite: 'Strict'
        //sameSite: 'lax'
    };

    return {
        access: [accessTokenHeaderLabel, accessToken, cookieOptions],
        refresh: [refreshTokenHeaderLabel, refreshToken, cookieOptions]
    };
}

export const setAuthCookies = async (res, user, expiresIn=null) => {

    let { accessToken, refreshToken } = await createToken(user);

    const cookieOptions = {
        httpOnly: true,
        // secure: true, //for HTTPS only
        // domain: "your-website.com",
        // promo_shown: 1,
        // sameSite: 'None',
        // secure: true,
        //sameSite: 'Strict'
        //sameSite: 'lax'
    };
    // let accessCookieLabel = 'saas-access-' + user.role; 
    // let refreshCookieLabel = 'saas-refresh-' + user.role;

    let accessCookieLabel = accessTokenHeaderLabel; 
    let refreshCookieLabel = refreshTokenHeaderLabel;

    res.cookie(accessCookieLabel,accessToken,cookieOptions)
    res.cookie(refreshCookieLabel,refreshToken,cookieOptions)
    
    return tokenCookies({ accessToken, refreshToken });
}

export const deleteAuthCookies = (res, key) => {
    // let accessCookieLabel = 'saas-access-' + key; 
    // let refreshCookieLabel = 'saas-refresh-' + key;
    let accessCookieLabel = accessTokenHeaderLabel; 
    let refreshCookieLabel = refreshTokenHeaderLabel;
    res.clearCookie(accessCookieLabel)
    res.clearCookie(refreshCookieLabel)
}

// export const getAuthCookies = (req, key) => {
//     let accessCookieLabel = 'saas-access-' + key; 
//     let refreshCookieLabel = 'saas-refresh-' + key;
    
//     return {
//         accessCookie: req.cookies(accessCookieLabel),
//         refreshCookie: req.cookies(refreshCookieLabel)
//     }
// }


export const validateAccessToken = (token) => {
    try {
        return verify(token, ACCESS_TOKEN_KEY);
    } catch (e) {
        return null;
    }
}

export const validateRefreshToken = (token) => {
    try {
        return verify(token, REFRESH_TOKEN_KEY);
    } catch (e) {
        return null;
    }
}

/*
when signUp/signIn create token in server
then pass to client to save in cookie

only do storing the token in client side
and always pass token into headers

server always check headers
if not found mean not logged in
depends on what mutation called, create token for login or continue function that doesnt require auth

if found then continue function

server to client after signIn/signUp (passed as obj with {accessToken,refreshToken})
client to server (passed in headers as x-a-token, x-r-token)

*/