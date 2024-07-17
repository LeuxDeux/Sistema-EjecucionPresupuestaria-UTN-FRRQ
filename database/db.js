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
        console.log('Conectado correctamente a la base de datos');
    }
});

module.exports = connection;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const mysql = require('mysql2');

// function connectToDatabase() {
//     const connection = mysql.createConnection({
//         host: process.env.DB_HOST || process.env.MYSQL_DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD,
//         database: process.env.DB_DATABASE
//     });

//     connection.connect((error) => {
//         if (error) {
//             console.error('Error connecting to the database:', error.message);
//             setTimeout(connectToDatabase, 5000); // Reintentar la conexión en 5 segundos
//         } else {
//             console.log('Conectado correctamente a la base de datos');
//         }
//     });

//     return connection;
// }

// const connection = connectToDatabase();

// module.exports = connection;
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// const mysql = require('mysql2');

// console.log('DB_HOST:', process.env.DB_HOST);
// console.log('DB_USER:', process.env.DB_USER);
// console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
// console.log('DB_DATABASE:', process.env.DB_DATABASE);

// function connectToDatabase() {
//     const connection = mysql.createConnection({
//         host: process.env.DB_HOST || process.env.MYSQL_DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD,
//         database: process.env.DB_DATABASE
//     });

//     connection.connect((error) => {
//         if (error) {
//             console.error('Error connecting to the database:', error.message);
//             setTimeout(connectToDatabase, 5000); // Reintentar la conexión en 5 segundos
//         } else {
//             console.log('Conectado correctamente a la base de datos');
//         }
//     });

//     return connection;
// }

// const connection = connectToDatabase();

// module.exports = connection;
