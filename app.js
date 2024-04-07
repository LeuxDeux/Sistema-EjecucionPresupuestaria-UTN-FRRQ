const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2');

const app = express();
//motor plantillas
app.set('view engine', 'ejs');
//carpeta public static
app.use(express.static('public'));
//urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); //permite recibir json en las rutas
//variables entorno
dotenv.config({path: './env/.env'});

const connection = require('./database/db');
//cookies
// app.use(cookieParser());
// //eliminar cache
// app.use(function (req, res, next) {
//     if(!req.user)
//         res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
//     next();
// });

app.listen(3000, ()=>{
    console.log("Server is running on port http://localhost:3000");
});
// app.get('/', (req, res)=>{
//     res.render('index');
// });

//llamar router.js
// app.use('/', require('./routes/router'));

app.get('/', (req, res)=>{
    res.render('login');
});
app.get('/registro', (req, res)=>{
    connection.query('SELECT * FROM secretarias', (error, results)=>{
        if(error){
            throw error;
        }else{
            res.render('registro', {results:results});
        }
    });
});
const crud = require('./controllers/controllers');
app.post('/crear-categorias', crud.crearCategorias);

