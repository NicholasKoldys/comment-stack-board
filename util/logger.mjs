'use strict';
/**
 * 
 * @param {Integer} level - 1 || 2 || 3 - log level
 * @param {...String} content  - log text content.
 * @returns 
 */
export function debugLog(level, ...content) {

    try {
        if(!process.env.DEBUG_MODE && level <= process.env.DEBUG_THRESHOLD) return;
    
        process.stdout.write( `${level} : ` + new Date().toISOString() + ' : ' );
    
        for(let i = 1; i < arguments.length; i++) {

            if(arguments[i] === null) {
                process.stdout.write('null');
            } else if(arguments[i] == undefined) {
                process.stdout.write('undefined');
            } else if(typeof arguments[i] == 'object') {
                process.stdout.write('Object >> ' + JSON.stringify(arguments[i]));
            } else if(typeof String != arguments[i]) {
                process.stdout.write(arguments[i].toString());
            } else {
                process.stdout.write(arguments[i]);
            }

            if(i + 1 === arguments.length) {
                process.stdout.write( '\n\n' );
            }
        }
    } catch (excep) {

        process.stdout.write( new Date().toISOString() + ' : ' );
        process.stdout.write('DebugLog Failed to Print: ');
        process.stdout.write(e);
        process.stdout.write(excep.stack);
        process.stdout.write( '\n\n' );
    }
}