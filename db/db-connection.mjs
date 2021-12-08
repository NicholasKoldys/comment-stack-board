'use strict';
import postgres from "pg";
import { debugLog } from '../util/logger.mjs';

/* Check process.env variables for connection config */
// ! Make sure the DB is correct or all table queries will require edditing.
const pool = new postgres.Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    max: 4,
    idleTimeoutMillis: 2000,
    connectionTimeoutMillis: 5000,
});

/**
 * 
 * @returns {Boolean} true|false
 */
async function testDb() {
    // try {
        debugLog(1, 'Connecting to database...');
        try {
            let query = await pool.query( {
                name: 'test-db-time',
                text: 'SELECT NOW();',
                rowMode: 'array', //rowMode : array - bypasses json parser
                values: []
            } );
            debugLog(1, 'Testing database...');
            if(Boolean(query)) {
                if(query.rowCount === 1) {
                    debugLog(3, 'PostgresDB Test: ', query.rows[0].toString());
                    return true;
                }
            }
            throw 'Database query failed to retrieve result.'
        } catch (e) {
            debugLog(3, 'Error executing query.', e, e.stack);
            return false;
        }
        /* pool.connect((err, client, release) => {
            try {
                if (err) {
                    debugLog(1, 'Error acquiring client', err.stack);
                    throw 'Error occured connecting to the database pool.';
                }
                client.query('SELECT NOW()', (err, res) => {
                    try {
                        debugLog(1, 'Testing dabase...');
                        release();
                        if (err) {
                            debugLog(1, 'Error executing query', err.stack);
                            throw 'Error occured with database query.';
                        }
                        for(let row of res.rows) {
                            debugLog(3, 'PostgresDB Test: ', JSON.stringify(row));
                        }
                        if(res.rows.length > 0) {
                            return true;
                        }
                        throw 'Error occured with database query. It retrieved no result.';
                    } catch(e) { debugLog(3, '', e, e.stack); return false; }
                });
            } catch(e) { debugLog(3, '', e, e.stack); return false; }
        }); */
    // } catch (e) { debugLog(3, '', e, e.stack); return false; }
};

function shutdownDBPool() {
    try {
        pool.end().then( () => debugLog(3, 'PostgresDB pool: closed') );
    } catch (e) { debugLog(3, '', e, e.stack); }
}

export { pool, testDb };