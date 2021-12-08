'use strict';
import { pool } from './db-connection.mjs';
import { debugLog } from '../util/logger.mjs';


const CREATE_COMMENT = {
    name: 'ins-comment-w-values',
    text: 'INSERT INTO comment (content, "comment.id", "user.id") VALUES ($1, $2, $3);',
    rowMode: 'array', //rowMode : array - bypasses json parser
    values: [1, 2, 3]
}

const GET_COMMENT = {
    name: 'get-comment-w-id',
    text: "SELECT * FROM comment WHERE id = $1;",
    rowMode: 'array', //rowMode : array - bypasses json parser
    values: [1]
}

const GET_THREAD_COMMENTS = {
    name: 'get-comment-w-thread',
    text: "SELECT * FROM comment WHERE comment.id = $1;",
    rowMode: 'array', //rowMode : array - bypasses json parser
    values: [1]
}

const GET_ALL_THREADS = {
    name: 'get-comments',
    text: "SELECT * FROM comment;",
    rowMode: 'array', //rowMode : array - bypasses json parser
}

// TODO ONLY Accept confirmed comments
const GET_ALL_THREADS_PUBLIC = {
    name: 'get-comments',
    text: 'SELECT comment.id AS "comment_id", comment.content, comment."comment.id" AS "thread_id", login.name AS user, comment.created '
            + 'FROM comment LEFT JOIN login ON comment."user.id" = login.id;',
    rowMode: 'json',
}

export async function createComment(content, threadId, userId) {
    try {
        debugLog(6, `Creating comment: ${content} | thread: ${threadId} | user: ${userId} .`);
        let query = await pool.query(CREATE_COMMENT, [ content, threadId, userId ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return true;
            }
        }
        throw 'Comment could not be created.';
    } catch (e) {
        debugLog(3, '', e, e.stack);
        return false;
    }
}

export async function getComment(commentId) {
    try {
        let query = await pool.query(GET_COMMENT, [ commentId ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return query.rows[0];
            }
        }
        throw 'Comment does not exist with id.';
    } catch (e) {
        debugLog(3, '', e, e.stack);
    }
}

export async function getThreadComments(threadId) {
    try {
        let query = await pool.query(GET_THREAD_COMMENTS, [ threadId ]);
        if(Boolean(query)) {
            if(query.rowCount === 1) {
                return query.rows;
            }
        }
        return null;
    } catch (e) {
        debugLog(3, '', e, e.stack);
    }
}

export async function getAllThreads() {
    try {
        let query = await pool.query(GET_ALL_THREADS);
        if(Boolean(query)) {
            return query.rows;
        }
        throw 'Unable to execute query.';
    } catch (e) {
        debugLog(3, '', e, e.stack);
    }
}

export async function getAllThreadsPublic() {
    try {
        let query = await pool.query(GET_ALL_THREADS_PUBLIC);
        if(Boolean(query)) {
            return query.rows;
        }
        throw 'Unable to execute query.';
    } catch (e) {
        debugLog(3, '', e, e.stack);
        return [
            {
                comment_id : 0,
                content : 'Comments are not able to load please. \nCheck with the site admin.',
                thread_id : 0,
                user : 'BOT',
                created : new Date()
            }
        ];
    }
}