const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const app = express();
//motor plantillas
app.set('view engine', 'ejs');
//carpeta public static
app.use(express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));
//urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); //permite recibir json en las rutas
//variables entorno
dotenv.config({path: './env/.env'});

const connection = require('./database/db');
const bcryptjs = require('bcryptjs'); 
const session = require('express-session');     //manejo de sesiones
app.use(session({
    secret:'secret',       //clave secreta para cifrar las cookies
    resave: true,            //guarda la sesion aunque no haya cambios
    saveUninitialized:true   //guarda la cookie aunque no haya sido inicializada previamente
}));
const mysql = require('mysql2');
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
app.post('/register', async (req, res) => {
    const usuario = req.body.usuario;
    const nombres = req.body.nombres;
    const secretaria = req.body.secretaria;
    const contraseña = req.body.contraseña;
    const email = req.body.email;
    let contraseñaHash = await bcryptjs.hash(contraseña, 8);
    connection.query('INSERT INTO usuarios SET ?', {
        nombres: nombres,
        email: email,
        password: contraseñaHash,
        secretaria_id: secretaria,
        usuario: usuario
    }, async (error, results) => {
        if (error) {
            throw error;
        } else {
            // Renderizar la plantilla 'registro.ejs' pasando 'results' junto con las variables relacionadas con el mensaje de alerta
            connection.query('SELECT * FROM secretarias', (error, resultsSecretarias) => {
                if (error) {
                    throw error;
                } else {
                    res.render('registro', {
                        results: resultsSecretarias, // Pasar 'resultsSecretarias' que contiene las secretarías
                        alert: true,
                        alertTitle: "Registro",
                        alertMessage: "¡Registro Exitoso!",
                        alertIcon: 'success',
                        showConfirmButton: false,
                        timer: 1500,
                        ruta: ''
                    });
                }
            });
        }
    });
});
const crud = require('./controllers/controllers');
app.post('/crear-categorias', crud.crearCategorias);

