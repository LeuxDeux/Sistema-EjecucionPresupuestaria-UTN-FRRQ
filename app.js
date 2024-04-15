const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2');
const multer = require('multer'); // Importar Multer para manejar la carga de archivos
const fs = require('fs'); // Importar FileSystem para operaciones de archivos
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
const session = require('express-session');     //manejo de sesiones
app.use(session({
    secret:'secret',       //clave secreta para cifrar las cookies
    resave: true,            //guarda la sesion aunque no haya cambios
    saveUninitialized:true   //guarda la cookie aunque no haya sido inicializada previamente
}));

//cookies
// app.use(cookieParser());
// //eliminar cache
// app.use(function (req, res, next) {
//     if(!req.user)
//         res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
//     next();
// });
// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({ // Función de almacenamiento en sistemas de archivos del servidor
    destination: function (req, file, cb) {
        cb(null, 'uploads'); // Directorio donde se almacenarán los archivos
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Nombre original del archivo
    }
});

const upload = multer({ storage: storage }); // Configurar Multer con la configuración de almacenamiento, se puede modificar para agregar filtro, tamaño y a que servicio se debe guardar
app.listen(3000, ()=>{
    console.log("Server is running on port http://localhost:3000");
});

///////
//RUTAS
const routes = require('./routes/routes');

//ROOT
app.get('/', routes.root);

//LOGIN
app.get('/login', routes.login);

//REGISTRO
app.get('/registro', routes.registro);

/////////////
//CONTROLLERS
const crud = require('./controllers/controllers');

//USUARIO
app.post('/register', crud.registrarUsuario);
app.post('/auth', crud.autentificacion);
app.get('/logout', crud.logout);

//CATEGORÍAS
app.post('/crear-categorias', crud.crearCategorias);
app.post('/editar-categorias', crud.editarCategoria);
app.get('/categorias', crud.categorias);

//FACTURAS
app.get('/facturas', crud.facturas);
app.post('/cargar-factura', upload.single('pdf'), crud.cargarFactura);
app.get('/descargar-archivo/:id', crud.descargarArchivo);

//ANALITICAS
app.get('/analiticas', crud.analiticas);