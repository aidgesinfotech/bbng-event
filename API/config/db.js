require('dotenv').config();
const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    port: Number(process.env.DB_PORT || 3306),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'scanner',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL || 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 20000
});

// Promisify the pool query method for convenience
const db = pool.promise();

module.exports = db;
