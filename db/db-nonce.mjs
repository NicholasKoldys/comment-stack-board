'use strict';
import { pool } from './db-connection.mjs';
import { debugLog } from '../util/logger.mjs';

const CREATE_NONCE = {
    name: 'Create Nonce',
    text: "INSERT INTO nonce (code, ecode_id) VALUES ($1, $2) RETURNING exp;",
    rowMode: 'array', //rowMode : array - bypasses json parser
    values: [1, 2]
}

const GET_NONCE = {
    name: 'Get Nonce-with-fk',
    text: "SELECT * FROM nonce WHERE ecode_id = $1;",
    values: [1]
}

const UPDATE_REISSUE_NONCE = {
    name: 'ReIss Nonce',
    text: "UPDATE nonce SET code = $2, exp = $3 WHERE ecode.id = $1 RETURNING code, exp;",
    rowMode: 'json', //rowMode : array - bypasses json parser
    values: [1, 2, 3]
}

const DELETE_NONCE = {
    name: 'Delete Nonce-with-fk',
    text: "DELETE FROM nonce WHERE ecode_id = $1;",
    rowMode: 'array', //rowMode : array - bypasses json parser
    values: [1]
}

/**
 * 
 * @param {Number} eCodeId 
 * @param {String} nonce 
 * @returns {Date}
 */
async function createNonce(eCodeId, nonce) {
    try {
        let query = await pool.query(CREATE_NONCE, [ nonce, eCodeId ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return query.rows[0][0];
            }
        }
        throw `Nonce was not created with values: ${nonce}, ${eCodeId}.`;
    } catch (e) {
        debugLog(6, '', e, e.stack);
    }
}

/**
 * 
 * @param {Number} eCodeId
 * @returns {Object}
 */
async function getNonce(eCodeId) {
    try {
        let query = await pool.query(GET_NONCE, [ eCodeId ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return query.rows[0];
            }
        }
        throw `Nonce does not exisit with eCodeId: ${eCodeId}.`;
    } catch (e) {
        debugLog(6, '', e, e.stack);
    }
}

/**
 * 
 * @param {Number} eCodeId 
 * @param {String} nonce
 * @param {Date} nonce 
 * @returns {Object<Code, Exp>}}
 */
async function renewNonce(eCodeId, nonce, exp) {
    try {
        let query = await pool.query(UPDATE_REISSUE_NONCE, [ eCodeId, nonce, exp ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return query.rows[0];
            }
        }
        throw `Nonce was not updated with values: ${eCodeId}, ${nonce}, ${exp}.`;
    } catch (e) {
        debugLog(6, '', e, e.stack);
    }
}

/**
 * 
 * @param {Number} ecodeId 
 * @returns {Boolean}
 */
async function deleteNonce(ecodeId) {
    try {
        let query = await pool.query(DELETE_NONCE, [ ecodeId ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return true;
            }
        }
        return false;
    } catch (e) {
        debugLog(6, '', e, e.stack);
    }
}

export { createNonce, getNonce, renewNonce, deleteNonce };