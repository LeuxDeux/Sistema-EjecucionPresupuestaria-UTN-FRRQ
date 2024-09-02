const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
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

// Ruta al directorio 'build'
app.use(express.static(path.join(__dirname, 'build'), { dotfiles: 'allow' }));




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
app.get('/fondos-registros', crud.registroFondos);

app.get('/api/facturas', (req, res) => {
    if (req.session.loggedin && req.session.secretaria == '1') {
        connection.query('SELECT f.*, DATE_FORMAT(f.fecha_carga, "%d/%m/%Y") AS fecha_formateada, u.nombres AS nombre_usuario, c.nombre AS nombre_categoria, sec.nombre AS nombre_secretaria FROM facturas f JOIN usuarios u ON f.usuario_id = u.id JOIN categorias c ON f.categoria_id = c.id JOIN secretarias sec ON u.secretaria_id = sec.id WHERE f.estado = "en proceso"', (error, results) => {  
            if (error) {
                console.error('Ha ocurrido un error interno al consultar con la base de datos: ', error);
                return res.status(500).json({ error: 'Error interno del servidor' });
            } else {
                // Envía los resultados como JSON
                res.json(results);
            }
        });
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
});
app.get('/api/ingresos_secretarias', (req, res) =>{
    if(req.session.loggedin && req.session.secretaria == '1') {
        connection.query('SELECT ingresos.id_ingreso, ingresos.fecha_ingreso, DATE_FORMAT(ingresos.fecha_ingreso, "%d/%m/%Y") AS fecha_ingreso_formateada, ingresos.nombre_ingreso, categorias.nombre AS nombre_categoria, ingresos.monto, usuarios.nombres AS nombre_usuario, secretarias.nombre AS nombre_secretaria FROM ingresos JOIN categorias ON ingresos.categoria_id = categorias.id JOIN usuarios ON ingresos.usuario_id = usuarios.id JOIN secretarias ON ingresos.secretaria_id = secretarias.id ORDER BY ingresos.fecha_ingreso DESC;', (error, results) => {
            if(error) {
                console.error('Ha ocurrido un error interno al consultar con la base de datos: ', error);
                return res.status(500).json({error: 'Error interno del servidor'});
            }else{
                res.json(results);
            }
        });
    }else{
        res.status(401).json({ error: 'No autorizado'});
    }
});
//Comienzo de endpoints para evolución en graficos Chart.js/HighCharts de registros-fondos
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//espera un parámetro semana en la consulta y devuelve los fondos disponibles de esa semana.
app.get('/api/fondos-disponibles-semana', (req, res) => {
    const { semana } = req.query;
    if(!semana) {
        return res.status(400).json({ error: 'Falta el parámetro semana' });
    }
    const query = `
        SELECT 
    nombre_categoria_fondo, 
    COALESCE(total_monto_peso, 0) AS total_monto_peso, 
    COALESCE(total_monto_dolar, 0) AS total_monto_dolar,  
    semana, 
    año
FROM 
    vista_registro_fondos_disponibles
WHERE 
    semana COLLATE utf8mb4_unicode_ci = ?
    `;
    connection.query(query, [semana], (error, resultados) => {
        if (error) {
            console.error('Error al obtener los fondos disponibles: ', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        res.json(resultados);
    });
});
//devuelve una lista de semanas disponibles.
app.get('/api/semanas-disponibles', (req, res) => {
    const query = `
        SELECT DISTINCT semana
        FROM vista_registro_fondos_disponibles
        ORDER BY semana DESC;
    `;
    
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener semanas disponibles:', error);
            res.status(500).json({ error: 'Error al obtener semanas disponibles' });
        } else {
            res.json(results.map(row => row.semana));
        }
    });
});
//devuelve todos los fondos sin filtrar por semana.
app.get('/api/fondos-disponibles-todos', (req, res) => {
    // Aquí deberías obtener todos los datos sin filtrar por semana
    const query = `SELECT 
    cf.nombre_categoria_fondo, 
    COALESCE(fd.monto_peso, 0) AS total_monto_peso,
    COALESCE(fd.monto_dolar, 0) AS total_monto_dolar,
    #WEEK(fd.fecha_carga, 1) AS semana, 
    YEAR(fd.fecha_carga) AS año,
    CONCAT(
        WEEK(fd.fecha_carga, 1), ' - (', 
        DATE_FORMAT(STR_TO_DATE(CONCAT(YEAR(fd.fecha_carga), WEEK(fd.fecha_carga, 0), ' Monday'), '%X%V %W'), '%d-%m-%y'), ' / ',
        DATE_FORMAT(DATE_ADD(STR_TO_DATE(CONCAT(YEAR(fd.fecha_carga), WEEK(fd.fecha_carga, 0), ' Monday'), '%X%V %W'), INTERVAL 6 DAY), '%d-%m-%y'),
        ')'
    ) AS semana
FROM 
    fondos_disponibles fd
JOIN 
    categorias_fondos cf ON fd.id_categoria_fondo = cf.id_categoria_fondo
ORDER BY 
    año DESC, semana DESC;`;
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
app.get('/api/fondos-evolucion', (req, res) => {
    const query = `
        SELECT 
            cf.nombre_categoria_fondo, 
            WEEK(fd.fecha_carga, 1) AS semana, 
            YEAR(fd.fecha_carga) AS año,
            COALESCE(SUM(fd.monto_peso), 0) AS total_monto_peso,
            COALESCE(SUM(fd.monto_dolar), 0) AS total_monto_dolar
        FROM 
            fondos_disponibles fd
        JOIN 
            categorias_fondos cf ON fd.id_categoria_fondo = cf.id_categoria_fondo
        GROUP BY 
            cf.nombre_categoria_fondo, 
            semana, 
            año
        ORDER BY 
            cf.nombre_categoria_fondo, 
            año, 
            semana;
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener la evolución de fondos: ', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
    });
});
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//Final de endpoints para evolución en graficos Chart.js/HighCharts de registros-fondos