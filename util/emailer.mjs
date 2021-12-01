'use strict';
import fs from 'fs/promises';
import { google } from 'googleapis';
import { debugLog } from './logger.mjs';

// ! In .ENV the REDIRECT_URI must be https://
// ! REDIRECT_URI must be posted in Google Cloud API Console

const AUTHE_PATH = './.private/token.json';
const AUTHO_PATH = './.private/authorization-token.json';

const SCOPES = [
    'https://mail.google.com/',
    /* 'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send', */
];


/**
 * Create an OAuth2 client with the saved or retrieved credentials.
 */
async function getAuthorization() {
    try {
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GM_CLIENT_ID,
            process.env.GM_CLIENT_SECRET,
            process.env.GM_REDIRECT_URI
        );

        let autheBuff = await fs.readFile(AUTHE_PATH);
        let authEFile = JSON.parse(autheBuff.toString('utf-8'));

        if(!Boolean(authEFile.access_token) || authEFile.expiry_date <= Date.now()) {

            let authResult;

            if(authEFile.expiry_date <= Date.now()) {
                oAuth2Client.setCredentials(authEFile);
                debugLog(3, 'Token Expired, generating new token...');
                authResult = await generateAccessToken(oAuth2Client, true);
            } else {
                debugLog(3, 'Getting new token for authorization...');
                authResult = await generateAccessToken(oAuth2Client);
            }

            if(!Boolean(authResult)) { throw 'Auth Failed.'; }
            debugLog(6, 'Auth Result: ', authResult.credentials);
            return authResult;

        } else {
            oAuth2Client.setCredentials(authEFile);
            debugLog(7, 'AuthClient set credentials: ', oAuth2Client?.credentials);
            return oAuth2Client;
        }
    } catch (e) { debugLog(3, 'Reading Authorization Failed: ', e, ' | ', e.stack); }
}

/**
 * @param {google.auth.OAuth2} oAuth2Client
 * @param {Boolean} isExpired
 */
async function generateAccessToken(oAuth2Client, isExpired) {
    try {
        let authoBuff = await fs.readFile(AUTHO_PATH);
        let authOFile = JSON.parse(authoBuff.toString('utf-8'));

        if(!Boolean(authOFile.auth_token)) {
            debugLog(6, 'Unable to authorize Gmailer automatically, see "Emailer.mjs", as authorization token is not set or needs te be reset for recent code changes. Please follow url and set it in the file ".private/authorization-token.json" ');
            renewAuthorizationToken(oAuth2Client);
            throw 'Must renew authorization.';
        }

        let accessToken;

        if(isExpired) {
            // ? Have the credentials set before attempting getAccessToken - as it utilizes the refresh token.
            accessToken = await oAuth2Client.getAccessToken();
            if(!Boolean(accessToken)) { throw 'Error retrieving access token.'; }
        } else {
            // ! to see the exact error use callback in function > (err) 
            accessToken = await oAuth2Client.getToken( authOFile.auth_token );
            if(!Boolean(accessToken)) { throw 'Error retrieving access token.'; }
        }

        debugLog(3, 'Setting new Gmailer Token.');

        debugLog(6, 'Token :: ', accessToken?.res?.data?.access_token );

        if(Boolean(accessToken?.res?.data?.access_token)) {
            fs.writeFile(AUTHE_PATH, JSON.stringify(accessToken?.res?.data), (err) =>  {
                debugLog(1, '', err);
            });
    
            debugLog(7, 'Writing generating access_token data: ', accessToken.res.data);
            oAuth2Client.setCredentials(accessToken.res.data);
            return oAuth2Client;
        } else {
            throw 'Error retrieving access token.';
        }

    } catch (e) { 
        debugLog(3, 'CRITCIAL! Issue with getting Token: ', e , ' | ', e.stack); 
        debugLog(6, 'Writing Empty Autho Token for review.');
        // Remove authorization token so server is forced to renew.
        writeAuthorizationToken('');
    }
}

/**
 * 
 * @returns 
 */
async function getGmailClient() {
    try {
        debugLog(6, 'Fetching GmailClient');

        let auth = await getAuthorization();
        if(!Boolean(auth)) { throw 'Failed to getAuthorization.'; }

        const gmail = google.gmail({version: 'v1', auth});

        let profile = await gmail.users.getProfile({ userId: process.env.GM_CLIENT_EMAIL });
        if (!Boolean(profile)) { throw 'The API returned an error.'; }

        return gmail.users;

    } catch (e) {
        if(e.errno == 'ENOTFOUND') {
            debugLog(3, 'CRITICAL! Failed getting GmailClient: Unable to send the request due to internet connection.'); 
        } else {
            debugLog(3, 'Failed getting GmailClient: ', e);
        }
        return null;
    }
}

/**
 * 
 * @param {String} recipient 
 * @param {String} emailDescription
 * @param {String} emailContent
 * @param {String} [file] 
 */
async function sendMail(recipient, emailDescription, emailContent, file) {
    try {
        if(Boolean(file)) {
            emailContent = file;
        } else if(!Boolean(recipient) || !Boolean(emailDescription) || !Boolean(emailContent)) {
            throw 'Empty email content.';
        }

        const gClient = await getGmailClient();
        if(!Boolean(gClient)) { throw 'Failed to getGmailClient'; }
        
        const subject = emailDescription;
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `From: COMMENT-STACK-MESSAGE-BOARD Mailer <${process.env.GM_CLIENT_EMAIL}>`,
            `To: ${recipient}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            emailContent,
        ];
        const message = messageParts.join('\n');
        // The body needs to be base64url encoded.
        const encodedMessage = Buffer.from(message) .toString('base64') .replace(/\+/g, '-') .replace(/\//g, '_') .replace(/=+$/, '');
        const sentMessage = await gClient.messages.send({ userId: 'me', requestBody: { raw: encodedMessage } });

        return sentMessage.data;

    } catch (e) { debugLog(1, "Request to send email Failed : ", e, ' | ', e.stack); }
}

/**
 * 
 * @param oAuth2Client 
 * @returns 
 */
function renewAuthorizationToken(oAuth2Client) {
    
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    debugLog(1, 'Authorize this Email Mailer with Gmail by visiting this url: ', authUrl, '\n');
    return false;
}

/**
 * 
 * @param authoToken 
 */
function writeAuthorizationToken(authoToken) {

    const jsonedToken = {
        auth_token: authoToken
    };

    debugLog(6, 'Writing Authorization Token: ', jsonedToken);
    
    fs.writeFile(AUTHO_PATH, JSON.stringify(jsonedToken), (err) => {
        debugLog(3, 'Failed Writing Autorization: ', err);
    });
}

/**
 * 
 * @returns 
 */
async function testMailer() {
    try {
        debugLog(1, 'Testing Gmailer..');

        const gClient = await getGmailClient();
        if(!Boolean(gClient)) { throw 'Failed to getGmailClient'; }

        let profile = await gClient.getProfile({ userId: process.env.GM_CLIENT_EMAIL });
        if(!Boolean(profile)) { throw 'The API returned an error.'; }

        return debugLog(3, 'GMail Auth Profile: ', profile.data);
        
    } catch (e) { debugLog(1, 'Emailer Test Failed: ', e, ' | ', e.stack); return false; }
}

export { testMailer, writeAuthorizationToken, sendMail };