const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: 'root',
    password: process.env.MYSQLDB_ROOT_PASSWORD,
    database: process.env.MYSQLDB_DATABASE
});
connection.connect((error) => {
    if(error){
        throw error;
    }else{
        console.log('Conectado correctamente a la base de datos');
    }
});

module.exports = connection;