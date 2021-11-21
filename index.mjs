'use strict';
import loadEnv, { setPepperEnv } from './util/load-env.mjs'; //? the function contains the specific words export default - so the import doesnt require { }
import { debugLog } from './util/logger.mjs';


loadEnv().then( (result, rejection) => {
    if(rejection) {
        debugLog(1, 'Application failed to load critical variables. ', rejection);
        return ;
    }
    debugLog(3, `Environment Variables Processed.. Process.env.TEST = " ${process.env.TEST} "`);

    import('./db/db-connection.mjs').then( ( module, rejection ) => {
        if(rejection) {
            debugLog(1, 'Application failed to load Database Connection. ', rejection);
            return ;
        }
        (async () => {
            let isDBReady = await module.testDb();
            if(isDBReady) {
                await setPepperEnv();
            }
        })();
    });

    import('./util/emailer.mjs').then( (module, rejection) => {
        if(rejection) {
            debugLog(1, 'Application failed to load Database Connection. ', rejection);
            return ;
        }
        (async () => {
            await module.testMailer();
        })();
    });

    import('./util/server.mjs');
    
});