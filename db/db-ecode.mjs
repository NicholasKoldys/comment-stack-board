'use strict';
import { pool } from './db-connection.mjs';
import { debugLog } from '../util/logger.mjs';

const CREATE_ECODE = {
    name: 'Set ECode-FK',
    text: "INSERT INTO ecode (code, login_id) VALUES ($1, $2) RETURNING id;",
    rowMode: 'array', //rowMode : array - bypasses json parser
    values: [1, 2]
}

const GET_ECODE_VERIFICATION = {
    name: 'Get ECODE-Verification',
    text: 'SELECT login.id as "login_id", login.name as "login_name", login.email as "login_email", ecode.id as "ecode_id", nonce.code as "nonce_code", nonce.exp as "nonce_exp" ' 
            + 'FROM ecode JOIN login ON login.id = ecode."login_id" '
                + 'JOIN nonce ON nonce."ecode_id" = ecode.id '
            + 'WHERE ecode.code = $1 AND login.name = $2 AND login.email = $3;',
    rowMode: 'json',
    values: [1, 2, 3]
}

const DELETE_ECODE = {
    name: 'Delete ECode-with-fk',
    text: "DELETE FROM ecode WHERE login_id = $1;",
    rowMode: 'array', //rowMode : array - bypasses json parser
    values: [1]
}

/**
 * 
 * @param {String} code 
 * @param {Number} loginId
 * @returns {Number} eCodeId
 */
export async function createECode(code, loginId) {
    try {
        let query = await pool.query(CREATE_ECODE, [ code, loginId ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return query.rows[0];
            }
        }
        throw `ECode was not created with values: ${code}, ${loginId}.`;
    } catch (e) {
        debugLog(3, '', e, e.stack);
    }
}

/**
 * 
 * @param ecode 
 * @param userName 
 * @param userEmail 
 * @param nonce 
 * @returns {Object} login_id, login_name, login_email, ecode_id, nonce_code, nonce_exp
 */
export async function getEcodeWLoginNonce(ecode, userName, userEmail, nonce) {
    try {
        let query = await pool.query(GET_ECODE_VERIFICATION, [ ecode, userName, userEmail]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return query.rows[0];
            }
        }
        throw `Ecode verification failed with info: ${ecode}, ${userName}, ${userEmail}.`
    } catch (e) {
        debugLog(3, '', e, e.stack);
    }
}

/**
 * 
 * @param {String} code 
 * @param {Number} loginId
 * @returns {Boolean} isDeleted
 */
export async function deleteECode(loginId) {
    try {
        let query = await pool.query(DELETE_ECODE, [ loginId ]);
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