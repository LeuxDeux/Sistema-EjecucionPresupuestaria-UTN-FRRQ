const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});
connection.connect((error) => {
    if(error){
        throw error;
    }else{
        //console.log('Conectado correctamente a la base de datos');
    }
});

module.exports = connection;