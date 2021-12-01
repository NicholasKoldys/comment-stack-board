'use strict';
import fs from 'fs/promises';
import { debugLog } from '../util/logger.mjs';

/**
 * 
 * @param {String} fileName 
 * @param {Object.<String, String>} values 
 * @returns {String} html
 */
export async function setValuesInHTML(fileName, values) {

    let html = await fs.readFile(`./public/view/${fileName}`, { encoding: 'utf-8'});

    for(let [replace, value] of Object.entries(values)) {
        // let raw = String.raw`replace`;
        // const replaceStr = String.raw`${replace}`;
        let regEx = RegExp(`(${replace})`, 'g');

        html = html.replace(regEx, value);
    }

    return html;
}

/**
 * Application specific url parser.
 * ! WARNING -- Contents are not sterilized
 * @param {String} reqUrl
 * @returns {Map}
 */
export function getURLArg(reqUrl) {
    try {
        let uriRight = reqUrl.split('?')[1];
    
        if(!Boolean(uriRight)) throw 'The url does not have arguements.';
        
        let argList = uriRight.split('&');
        let argMap = new Map();
    
        for (let arg of argList) {
            let keyVal = arg.split('=');
            argMap.set(keyVal[0], keyVal[1]);
        }
    
        return argMap;

    } catch (e) { debugLog(3, '', e, e.stack); }
}

/**
 * 
 * @param {String} reqUrl 
 */
export function getGoogleAuthCode(reqUrl) {
    try {
        let googleAuthCode = decodeURIComponent( getURLArg( reqUrl ).get('code') );
        if(!Boolean(googleAuthCode)) throw 'Google Auth Code is empty.';

        let sterileCode = sterlizeUrlCode(googleAuthCode);
        if(sterileCode != googleAuthCode) { throw 'Google Auth Code does not meet standards set by Google.'; }
        debugLog(6, 'Google Auth Code: ', sterileCode);

        return sterileCode;
        
    } catch (e) { debugLog(3, '', e, e.stack); }
}

/**
 * 
 * @param {Object} reqCookie
 * @param {Array<String>} chkHeaders
 * @returns {Map}
 */
export function getClientCookieMap(reqCookie, chkValues) {
    try{ 
        if(!Boolean(reqCookie)) throw 'Cookie is empty.';
        debugLog(6, 'Checking the cookie: ', reqCookie);
        let cookieMap = new Map();
    
        for(const value of chkValues) {
            if(reqCookie.includes(value)) {
                let key = value;
                let firstValue = reqCookie.split(value + '=')[1].split(';');
                let val = firstValue[0];
                cookieMap.set(key, val);
            } else {
                throw 'Cookie does not contain checked value.';
            };
        }
        
        return cookieMap;

    } catch (e) { debugLog(3, '', e, e.stack); }
}