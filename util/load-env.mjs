'use strict';
import fs from 'fs';
import { pool } from '../db/db-connection.mjs';
import { debugLog } from './logger.mjs';

const envFIlePath = ".env";

/**
 * This function is blocking
 * 
 */
export default async function loadEnv() {
    try {
        /* Sync Read Full file - Blocking */
        let envContents = fs.readFileSync( envFIlePath, {encoding: 'utf8'});
    
        const lines = envContents.split(/\r?\n/);
        debugLog(3, 'Setting Env Variables...');
        lines.forEach((dataLine) => {
            let strArr = dataLine.split('=');
            eval('process.env.' + strArr[0] + ' = '+ strArr[1] + ';');
        });
    } catch (e) {
        debugLog(6, '', e, e.stack);
    }

    /* Async read method, read from stream as available - non-Blocking */
    /* let envFileStream = fs.createReadStream('.env', 'ascii');

    let rl = readline.createInterface({
        input: envFileStream
    });

    rl.on('line', (dataLine) => {
        let strArr = dataLine.split('=');
        eval('process.env.' + strArr[0] + ' = '+ strArr[1] + ';');
    });

    await once(rl, 'close', () => {
        rl.close();
    }); */
}

export async function setPepperEnv() {
    try {
        let query = await pool.query( {
            name: 'get-db-peper',
            text: 'SELECT pepper FROM pepper;',
            rowMode: 'array', //rowMode : array - bypasses json parser
            values: []
        } );
        debugLog(3, 'Setting Pepper Env...');
        if(query !== null) {
            let pepper = query.rows[0];
            eval(`process.env.PEPPER = "${pepper[0]}";`);
            // eval('process.env.PEPPER = "' + pepper[0] + '";');
            return true;
        }
        throw 'Unable to execute query.';
    } catch (e) {
        debugLog(3, 'CRITICAL! Loading Env Failed: ', e, ' | ', e.stack);
        return false;
    }
}