const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2');
const multer = require('multer'); // Importar Multer para manejar la carga de archivos
const path = require('path'); // Importar Path para manejar rutas de archivos
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
const bcryptjs = require('bcryptjs'); 
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
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); // Directorio donde se almacenarán los archivos
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Nombre original del archivo
    }
});

const upload = multer({ storage: storage }); // Configurar Multer con la configuración de almacenamiento
app.listen(3000, ()=>{
    console.log("Server is running on port http://localhost:3000");
});
// app.get('/', (req, res)=>{
//     res.render('index');
// });

//llamar router.js
// app.use('/', require('./routes/router'));

app.get('/', (req, res)=>{
    if(req.session.loggedin){
        res.render('index', {
            login: true,
            nombre: req.session.nombre,
            secretaria: req.session.secretaria,
            id_usuario: req.session.id_usuario
        });
    }else{
        res.render('index', {
            login: false,
            nombre: 'Debe iniciar sesión',
            secretaria: '',
        });
    }
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/menu-admin', (req, res) => {
    res.render('menu-admin');
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
app.post('/auth', async (req, res)=>{
    const usuario = req.body.usuario;
    const contraseña = req.body.contraseña;
    let contraseñaHash = await bcryptjs.hash(contraseña, 8);
    if(usuario && contraseña){
        connection.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], async (error, results)=>{
            if(results.length == 0 || !(await bcryptjs.compare(contraseña, results[0].password))) { // si la longitud del select es 0 o si no coincide la contraseña
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "¡Usuario y/o contraseña incorrectas!",
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });
            }else{
                req.session.loggedin = true; //estado de log
                req.session.nombre = results[0].nombres;
                req.session.secretaria = results[0].secretaria_id;
                req.session.id_usuario = results[0].id;
                console.log(req.session.secretaria);
                console.log(req.session.id_usuario);
                if(req.session.secretaria == '1'){
                    res.render('login', {
                        alert: true,
                        login: true,
                        nombre: req.session.nombre,
                        secretaria: req.session.secretaria,
                        id_usuario: req.session.id_usuario,
                        alertTitle: "Conexión Exitosa",
                        alertMessage: "¡Login Correcto!",
                        alertIcon: 'success',
                        showConfirmButton: false,
                        timer: 1500,
                        ruta: '',
                    });
                }else{
                    console.log(req.session.secretaria);
                    res.render('login', {
                        alert: true,
                        login: true,
                        nombre: req.session.nombre,
                        secretaria: req.session.secretaria,
                        id_usuario: req.session.id_usuario,
                        alertTitle: "Conexion Exitosa",
                        alertMessage: "¡Login Correcto!",
                        alertIcon: 'success',
                        showConfirmButton: false,
                        timer: 1500,
                        ruta: ''
                        });
                }
            }
        });
    }else{
        res.render('login', {
            alert: true,
            alertTitle: "Advertencia",
            alertMessage: "Por favor ingrese un usuario y contraseña",
            alertIcon: 'warning',
            showConfirmButton: true,
            timer: 1500,
            ruta: 'login'
        });
    }
});
app.get('/logout', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})
app.get('/categorias', (req, res) => {
    if (req.session.loggedin) {
        // Consulta SQL para seleccionar los nombres de las categorías con secretaria_id igual al req.session.secretaria
        connection.query('SELECT id, nombre FROM categorias WHERE secretaria_id = ?', [req.session.secretaria], (error, results) => {
            if (error) {
                throw error;
            } else {
                // Renderiza la plantilla 'categorias.ejs' y pasa los resultados de la consulta
                res.render('categorias', {
                    login: true,
                    nombre: req.session.nombre,
                    secretaria: req.session.secretaria,
                    id_usuario: req.session.id_usuario,
                    categorias: results // Aquí pasa los resultados de la consulta
                });
            }
        });
    } else {
        res.render('index', {
            login: false,
            nombre: 'Debe iniciar sesión',
            secretaria: ''
        });
    }
});
// Manejar la solicitud POST para cargar una factura
app.post('/cargar-factura', upload.single('pdf'), (req, res) => {
    const uploadedFile = req.file; // Obtener el archivo subido
    const nombreFactura = uploadedFile.originalname; // Usar el nombre original del archivo como nombre de factura
    const categoriaId = req.body.categoria; // Obtener el ID de la categoría seleccionada del cuerpo de la solicitud
    const monto = req.body.monto; // Obtener el monto del cuerpo de la solicitud
    const estado = 'en proceso'; // Valor predeterminado para el estado de la factura
    const usuarioId = req.body.idUsuario; // Obtener el ID de usuario del cuerpo de la solicitud

    if (uploadedFile) { // Verificar si se ha subido un archivo
        const newPath = path.join('uploads', uploadedFile.originalname); // Construir la ruta completa del nuevo archivo

        // Renombrar el archivo en el sistema de archivos
        fs.rename(uploadedFile.path, newPath, (err) => {
            if (err) { // Manejar errores si ocurren al renombrar el archivo
                console.error('Error al renombrar el archivo:', err);
                res.status(500).send({ error: 'Error interno del servidor' });
            } else { // Si el archivo se ha renombrado correctamente
                const fechaCarga = new Date().toISOString().slice(0, 19).replace('T', ' '); // Obtener la fecha actual
                const sql = 'INSERT INTO facturas (fecha_carga, nombre_factura, categoria_id, monto, estado, usuario_id, archivo_factura) VALUES (?, ?, ?, ?, ?, ?, ?)';
                // Insertar los datos de la factura en la base de datos
                connection.query(sql, [fechaCarga, nombreFactura, categoriaId, monto, estado, usuarioId, newPath], (err, result) => {
                    if (err) { // Manejar errores si ocurren al insertar datos en la base de datos
                        console.error('Error al insertar datos en la base de datos:', err);
                        res.status(500).send({ error: 'Error interno del servidor' });
                    } else { // Si los datos se insertaron correctamente en la base de datos
                        console.log('Datos insertados correctamente en la base de datos');
                        res.redirect('categorias'); // Redirigir a la página de inicio después de cargar la factura
                    }
                });
            }
        });
    } else { // Si no se ha subido ningún archivo
        res.status(400).send({ error: 'No se pudo subir el archivo' }); // Enviar un error al cliente
    }
});

const crud = require('./controllers/controllers');
app.post('/crear-categorias', crud.crearCategorias);
app.post('/editar-categorias', crud.editarCategoria);
//

