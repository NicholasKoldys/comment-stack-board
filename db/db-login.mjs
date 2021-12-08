'use strict';
import { pool } from './db-connection.mjs';
import { debugLog } from '../util/logger.mjs';

const COUNT_LOGIN_CONFIRMED = {
    name: 'Get Login-Verification',
    text: '(SELECT COUNT(*) FROM login WHERE name = $1 AND email = $2 AND confirm = true) UNION ALL (SELECT COUNT(*) FROM login WHERE name = $1 AND email = $2 AND confirm = false);',
    rowMode: 'array', //rowMode : array - bypasses json parser
    values: [1, 2]
}

const CREATE_LOGIN = {
    name: 'Set Login-Name-Email-Code',
    text: 'INSERT INTO login (name, pwd, email, confirm) VALUES ($1, $2, $3, false) RETURNING id;',
    rowMode: 'array', //rowMode : array - bypasses json parser
    values: [1, 2, 3]    
}

const GET_CONFIRMED_LOGIN = {
    name: 'get-login-w-name-pwd-confirmed',
    text: 'SELECT * FROM login WHERE name = $1 AND pwd = $2 AND confirm = true;',
    rowMode: 'json', //rowMode : array - bypasses json parser
    values: [1, 2]
}

const UPDATE_CONFIRM_LOGIN = {
    name: 'Update Login-Confrim-with-Email',
    text: 'UPDATE login SET confirm = true WHERE id = $1;',
    rowMode: 'array', //rowMode : array - bypasses json parser
    values: [1]
}

const DELETE_LOGIN = {
    name: "Delete Login",
    text: "DELETE FROM login WHERE id = $1",
    values: [1]
}

/**
 *
 * @param {String} user 
 * @param {String} email
 * @returns {Boolean} true|false
 */
export async function isLoginCreationValid(user, email) {
    try {
        let query = await pool.query(COUNT_LOGIN_CONFIRMED, [ user, email ]);
        if(Boolean(query)) {
            let count1 = query.rows[0];
            let count2 = query.rows[1];
            if(count1 == 0 && count2 == 1) {
                return true;
            }
        }
        return false;
    } catch (e) {
        debugLog(3, '', e, e.stack);
    }
}

/**
 * 
 * @param {String} user 
 * @param {String} pwd 
 * @param {String} email 
 * @returns {Number} loginId
 */
export async function createLogin(user, pwd, email) {
    try {
        let query = await pool.query(CREATE_LOGIN, [ user, pwd, email ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return query.rows[0];
            }
            // if(query.rowCount === 1) {
            //     return true;
            // }
        }
        throw `Login was not created with values: ${user}, ${pwd}, ${email}.`;
    } catch (e) {
        debugLog(3, '', e, e.stack);
    }
}

export async function getConfirmedLogin(user, pwd) {
    try {
        let query = await pool.query(GET_CONFIRMED_LOGIN, [ user, pwd ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return query.rows[0];
            }
        }
        throw 'Login does not exist or has not been confirmed.';
    } catch (e) {
        debugLog(3, '', e, e.stack);
    }
}

/**
 * 
 * @param {String} email 
 * @returns {Boolean}
 */
export async function updateLoginConfirmed( loginId ) {
    try {
        let query = await pool.query(UPDATE_CONFIRM_LOGIN, [ loginId ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return true;
            }
        }
        return false;
    } catch (e) {
        debugLog(3, '', e, e.stack);
    }
}

/**
 * 
 * @param {String} email 
 * @returns {Boolean}
 */
export async function deleteLogin( loginId ) {
    try {
        let query = await pool.query(DELETE_LOGIN, [ loginId ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return true;
            }
        }
        return false;
    } catch (e) {
        debugLog(3, '', e, e.stack);
    }
}