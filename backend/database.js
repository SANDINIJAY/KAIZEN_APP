const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',         // MySQL server host
    user: 'root',              // MySQL username
    password: 'Sj971202@@', // MySQL password
    database: 'my_project_db', // Database name
});

module.exports = pool;