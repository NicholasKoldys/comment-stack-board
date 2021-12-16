'use strict';
import http from 'http';
// import https from 'https';
// import fs from 'fs';
import { debugLog } from './logger.mjs';
import { checkGetRoute, checkPostRoute } from './router.mjs';

// * Docker container uses HOSTNAME as env.
const HOSTNAME = process.env.HOSTNAME || "127.0.0.1";

// ? Enable if running outside docker container
// const HOSTNAME = process.env.NODE_HOSTNAME || "127.0.0.1"

const PORT = process.env.NODE_PORT || 3000;

// const options = {
//     key: fs.readFileSync("./.private/ssl-self-cert/key.pem"),
//     cert: fs.readFileSync("./.private/ssl-self-cert/cert.pem")
// };

export var blackList = [ ];

// const server = https.createServer(options);
const server = http.createServer();

server.on('request', (req, res) => {

    var ip = req?.ip 
            || req?.connection?.remoteAddress 
            || req?.socket?.remoteAddress 
            || req?.connection?.socket?.remoteAddress;

    if(blackList.indexOf(ip) > -1) {
        return res.end();
    }

    if(req.method === 'GET') {
        debugLog(3, 'Recieved GET req..');
        return checkGetRoute(req, res);
    }

    if(req.method === 'POST') {
        debugLog(3, 'Recieved POST req..');
        return checkPostRoute(req, res);
    }
});

server.on('clientError', (err, socket) => {
    socket.end('HTTPS 400 Bad Request\r\n\r\n');
});

server.listen(PORT, HOSTNAME, () => {
    debugLog(1, `Server running at http://${HOSTNAME}:${PORT}/`);
    debugLog(1, 'Developed by: ', process.env.DEV_NAME);
    debugLog(1, 'Now Listening...');
});

export function terminateServer() {
    server.close(() => debugLog(3, 'Node Server: closed'));
}

// ? Export Module JS
export default 'server.mjs';