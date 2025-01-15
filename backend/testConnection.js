const oracledb = require('oracledb');

async function testConnection() {
    try {
        const connection = await oracledb.getConnection({
            user: 'AUTOMATION',           // Your Oracle DB username
            password: 'AUTO2024Oci##00',       // Your Oracle DB password
            connectString: '150.230.233.57:1521/ORCL',
            connectTimeout: 60000,
        });

        console.log('Successfully connected to the database!');
        await connection.close();
        
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
}

testConnection();
