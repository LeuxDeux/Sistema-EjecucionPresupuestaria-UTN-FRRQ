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
app.post('/borrar-categorias', crud.borrarCategoria);

//FACTURAS
app.get('/facturas', crud.facturas);
app.post('/cargar-factura', upload.single('pdf'), crud.cargarFactura);
app.get('/descargar-archivo/:id', crud.descargarArchivo);
app.post('/borrar-facturas', crud.borrarFactura);

//ANALITICAS
app.get('/analiticas', crud.analiticas);

app.get('/aceptar-factura/:id', crud.aceptarFactura);
app.get('/rechazar-factura/:id', crud.rechazarFactura);

//INGRESO
app.get('/ingresos', crud.ingresoGanancia);
app.post('/registrar-ingreso', crud.cargarIngreso);
app.post('/editar-ingreso', crud.editarIngreso);
app.post('/borrar-ingreso', crud.borrarIngreso);

//COMIENZO ESTADISTICAS/GRAFICO/TABLA
app.get('/tabla_grafica', crud.tablaGrafica);

//FACTURAS ACTIVAS
app.get('/facturas-activas', crud.facturasActivas);
app.post('/bl-factura', crud.facturasActivasBL); // No llevas /:id xq no se manda por url 'req.params.id' sino que se manda en el cuerpo por ser POST 'req.body.id'

//FONDOS CATEGORIAS
app.get('/fondos-categorias', crud.fondosCategorias);
app.post('/agregar-fondo-categoria', crud.cargarFondoCategoria);
app.post('/cargar-fondo', crud.cargarFondo);

//FONDOS DISPONIBLES
app.get('/fondos-disponibles', crud.fondosDisponibles);
app.post('/agregar-fondo', crud.cargarFondo);
app.post('/editar-fondo', crud.editarFondo);
app.post('/borrar-fondo', crud.borrarFondo);