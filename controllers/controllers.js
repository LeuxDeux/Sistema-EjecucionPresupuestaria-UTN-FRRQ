const connection = require('../database/db');
const fs = require('fs'); // Importar FileSystem para operaciones de archivos
const path = require('path'); // Importar Path para manejar rutas de archivos
const bcryptjs = require('bcryptjs'); 
const { render } = require('ejs');
const queryAnaliticas = 'SELECT f.*, DATE_FORMAT(f.fecha_carga, "%d/%m/%Y") AS fecha_formateada, u.nombres AS nombre_usuario, c.nombre AS nombre_categoria, sec.nombre AS nombre_secretaria FROM facturas f JOIN usuarios u ON f.usuario_id = u.id JOIN categorias c ON f.categoria_id = c.id JOIN secretarias sec ON u.secretaria_id = sec.id WHERE f.estado = "en proceso"';
const facturasAceptadas = 'SELECT f.*, DATE_FORMAT(f.fecha_carga, "%d/%m/%Y") AS fecha_formateada, u.nombres AS nombre_usuario, c.nombre AS nombre_categoria, sec.nombre AS nombre_secretaria FROM facturas f JOIN usuarios u ON f.usuario_id = u.id JOIN categorias c ON f.categoria_id = c.id JOIN secretarias sec ON u.secretaria_id = sec.id WHERE f.estado = "aceptado" AND f.visibilidad = "visible" ORDER BY f.fecha_carga DESC';
const facturasSelect = 'SELECT f.*, DATE_FORMAT(f.fecha_carga, "%d/%m/%Y") AS fecha_formateada, u.nombres AS nombre_usuario, c.nombre AS nombre_categoria, sec.nombre AS nombre_secretaria FROM facturas f JOIN usuarios u ON f.usuario_id = u.id JOIN categorias c ON f.categoria_id = c.id JOIN secretarias sec ON u.secretaria_id = sec.id WHERE u.secretaria_id = ?';
const categoriasSelect = 'SELECT id, nombre FROM categorias WHERE secretaria_id = ?';
/* 
//////////////////////
CONTROLLERS USUARIOS
//////////////////////
*/
//CREAR USUARIO
//BETA
//  exports.registrarUsuario = async (req, res) => { // METODO REGISTRO
//     const usuario = req.body.usuario; // Obtener los datos del formulario
//     const nombres = req.body.nombres; 
//     const secretaria = req.body.secretaria;
//     const contraseña = req.body.contraseña;
//     const email = req.body.email;
//     let contraseñaHash = await bcryptjs.hash(contraseña, 8);
//     connection.query('INSERT INTO usuarios SET ?', {
//         nombres: nombres,
//         email: email,
//         password: contraseñaHash,
//         secretaria_id: secretaria,
//         usuario: usuario
//     }, async (error, results) => {
//         if (error) {
//             throw error;
//         } else {
//             // Renderizar la plantilla 'registro.ejs' pasando 'results' junto con las variables relacionadas con el mensaje de alerta
//             connection.query('SELECT * FROM secretarias', (error, resultsSecretarias) => {
//                 if (error) {
//                     throw error;
//                 } else {
//                     res.render('registro', {
//                         results: resultsSecretarias, // Pasar 'resultsSecretarias' que contiene las secretarías
//                         alert: true,
//                         alertTitle: "Registro",
//                         alertMessage: "¡Registro Exitoso!",
//                         alertIcon: 'success',
//                         showConfirmButton: false,
//                         timer: 1500,
//                         ruta: ''
//                     });
//                     console.log('Valor de secretaria:', secretaria);
//                     console.log('APP.POST "/register". Se ha registrado el usuario: ' + nombres + ' en la secretaria: ' + resultsSecretarias.find(sec => sec.id === parseInt(secretaria)).nombre); // Muestra el nombre de usuario y la secretaria en la que se registro
//                     console.log('Redireccionando hacia index.ejs basandose en ruta: "vacio" y en sweetAlert en registro.ejs')
//                 }
//             });
//         }
//     });
// };
//CON MANEJO TRYCATCH
exports.registrarUsuario = (req, res) => {
    const usuario = req.body.usuario;
    const nombres = req.body.nombres; 
    const secretaria = req.body.secretaria;
    const contraseña = req.body.contraseña;
    const email = req.body.email;
    // Hash de la contraseña
    bcryptjs.hash(contraseña, 8, (hashError, contraseñaHash) => {
        if (hashError) {
            console.error('Error al generar hash de contraseña:', hashError);
            res.status(500).send(`
                    <h2>Error interno del servidor, ha ocurrido un error al encriptar la clave: ` + hashError`</h2>
                    <p>Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.</p>
                    <a href="/">Volver a la página principal</a>
                    `);
            return;
        }
        // Verificar si el usuario ya existe
        connection.query('SELECT COUNT(*) AS count FROM usuarios WHERE usuario = ?', [usuario], (selectError, countResult) => {
            if (selectError) {
                console.error('Error al verificar usuario existente:', selectError);
                res.status(500).send(`
                    <h2>Error interno del servidor, ha ocurrido un error al verificar el usuario</h2>
                    <p>Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.</p>
                    <a href="/">Volver a la página principal</a>
                    `);
                return;
            }
            // Si el usuario ya existe, enviar una respuesta al cliente
            if (countResult[0].count > 0) {
                res.status(400).send(`
                    <h2>Error</h2>
                    <p>El usuario '${usuario}' ya existe. Por favor, elige otro nombre de usuario.</p>
                    <a href="/registro">Volver a la página de registro</a>
                `);
                return;
            }
            // Insertar usuario en la base de datos
            connection.query('INSERT INTO usuarios SET ?', {
                nombres: nombres,
                email: email,
                password: contraseñaHash,
                secretaria_id: secretaria,
                usuario: usuario
            }, (insertError, results) => {
                if (insertError) {
                    console.error('Error al insertar usuario:', insertError);
                    res.status(500).send(`
                        <h2>Error interno del servidor, ha ocurrido un error al crear la cuenta: ` + insertError`</h2>
                        <p>Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.</p>
                        <a href="/">Volver a la página principal</a>
                        `);
                    return;
                }
                // Obtener la lista de secretarías
                connection.query('SELECT * FROM secretarias', (selectError, resultsSecretarias) => {
                    if (selectError) {
                        console.error('Error al obtener secretarías:', selectError);
                        res.status(500).send(`
                        <h2>Error interno del servidor, ha ocurrido un error al mostrar las secretarías: ` + selectError`</h2>
                        <p>Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.</p>
                        <a href="/">Volver a la página principal</a>
                        `);
                        return;
                    }
                    // Encontrar el nombre de la secretaría
                    const nombreSecretaria = resultsSecretarias.find(sec => sec.id === parseInt(secretaria)).nombre;
                    // Renderizar la plantilla 'registro.ejs'
                    res.render('registro', {
                        results: resultsSecretarias,
                        alert: true,
                        alertTitle: "Registro",
                        alertMessage: "¡Registro Exitoso!",
                        alertIcon: 'success',
                        showConfirmButton: false,
                        timer: 1500,
                        ruta: ''
                    });
                    console.log(`APP.POST "/register". Se ha registrado el usuario: ${nombres} en la secretaria: ${nombreSecretaria}`);
                    console.log('Redireccionando hacia index.ejs basándose en ruta: "vacio" y en sweetAlert en registro.ejs');
                });
            });
        });
    });
};
//AUTENTIFICACIÓN DE USUARIO
exports.autentificacion = async (req, res) =>{ // METODO AUTENTIFICACIÓN
    const usuario = req.body.usuario; // Valores del form
    const contraseña = req.body.contraseña;
    let contraseñaHash = await bcryptjs.hash(contraseña, 8);
    if(usuario && contraseña){ // Método .compare del hashing para comparar la contraseña con la base de datos
        connection.query('SELECT usuarios.*, secretarias.nombre AS nombre_secretaria FROM usuarios INNER JOIN secretarias ON usuarios.secretaria_id = secretarias.id WHERE usuario = ?', [usuario], async (error, results)=>{
            //Selecciona todas las columnas de la tabla usuarios y la columna 'nombre' de la tabla secretarias, asignandole 'nombre_secretaria' a la columna 'nombre' de la tabla secretarias' dejando como resultado 'nombre_secretaria'
            //Usa INNER JOIN para una unión entre la tabla 'usuarios' y 'secretarias' "usuarios.secretarias_id = secretarias.id"
            //En resumen busca seleccionar todas las columnas de la tabla 'usuarios' junto con el nombre de la secretaria correspondiente de la tabla 'secretarias' donde el usuario coincida con el valor proporcionado
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
                // Se establecen las variables de sesión para almacenar la info sobre que usuario inicio sesión, su id de secreteria y se cuenta
                req.session.loggedin = true; //estado de log
                req.session.nombre = results[0].nombres;
                req.session.secretaria = results[0].secretaria_id;
                req.session.id_usuario = results[0].id;
                req.session.nombreSecretaria = results[0].nombre_secretaria;
                console.log('Autentificación correcta del usuario: ' + req.session.nombre + ' con id de secretaria: ' + req.session.secretaria + ' con id de usuario: ' + req.session.id_usuario + ' en secretaria: ' + req.session.nombreSecretaria);
                //Método if-else sujeto a cambios de si es admin o no ATENCION!!
                if(req.session.secretaria == '1'){
                    res.render('login', {
                        alert: true,
                        login: true,
                        admin: true,
                        nombre: req.session.nombre,
                        secretaria: req.session.secretaria,
                        id_usuario: req.session.id_usuario,
                        nombreSecretaria: req.session.nombreSecretaria,
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
                        admin: false,
                        nombre: req.session.nombre,
                        secretaria: req.session.secretaria,
                        id_usuario: req.session.id_usuario,
                        nombreSecretaria: req.session.nombreSecretaria,
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
};

//CIERRE DE SESION DEL USUARIO
exports.logout = (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
};

/* 
//////////////////////
CONTROLLERS CATEGORÍAS
//////////////////////
*/

//CREAR CATEGORÍA
exports.crearCategorias = (req, res) => {
    if (req.session.loggedin) {
        try {
            const nombre = req.body.nombre;
            const secretaria_id = req.body.secretaria_id;
            const categoria = { nombre: nombre, secretaria_id: secretaria_id };

            connection.query('INSERT INTO categorias SET ?', categoria, (error, results) => {
                if (error) {
                    // Si hay un error al insertar en la base de datos
                    console.error('Error en la inserción de categoría:', error);
                    if (error.code === 'ER_DUP_ENTRY') {
                        // Si es un error de duplicación, enviar una respuesta 400 Bad Request
                        return res.status(400).send(`
                            <h2>Error de duplicación</h2>
                            <p>Ya existe una categoría con el mismo nombre para la secretaría especificada.</p>
                            <a href="/">Volver a la página principal</a>
                        `);
                    } else {
                        // Si es otro tipo de error, enviar una respuesta 500 Internal Server Error
                        return res.status(500).send(`
                            <h2>Error interno del servidor</h2> 
                            <p>Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.</p>
                            <a href="/">Volver a la página principal</a>
                        `);
                    }
                } else {
                    console.log('Categoría creada con éxito: ', nombre);
                    this.categorias(req, res);
                    // // Después de agregar la categoría, consulta nuevamente las categorías de la base de datos
                    // connection.query('SELECT * FROM categorias WHERE secretaria_id = ?', [secretaria_id], (error, categorias) => {
                    //     if (error) {
                    //         console.error('Error en la consulta de categorías:', error);
                    //         return res.status(500).send(`
                    //             <h2>Error interno del servidor</h2> ` + error `
                    //             <p>Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.</p>
                    //             <a href="/">Volver a la página principal</a>
                    //         `);
                    //     } else {
                    //         // Renderizar la vista categorias.ejs nuevamente con las nuevas categorías
                    //         res.render('categorias', {
                    //             login: true,
                    //             nombre: req.session.nombre,
                    //             secretaria: req.session.secretaria,
                    //             categorias: categorias,
                    //             id_usuario: req.session.id_usuario
                    //         });
                    //     }
                    // });
                }
            });
        } catch (error) {
            // Si hay un error en el código síncrono, enviar una respuesta 500 Internal Server Error
            console.error('Error en la creación de categoría:', error);
            return res.status(500).send(`
                <h2>Error interno del servidor</h2>
                <p>Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.</p>
                <a href="/">Volver a la página principal</a>
            `);
        }
    } else {
        // Si el usuario no está autenticado, redirigir al formulario de inicio de sesión
        res.render('login');
    }
};

//EDITAR CATEGORÍA
exports.editarCategoria = (req, res) => {
    if (req.session.loggedin) {
        try {
            const categoriaId = req.body.id; // Obtenemos el ID de la categoría desde el cuerpo de la solicitud
            const nuevoNombre = req.body.nuevoNombre; // Obtenemos el nuevo nombre de la categoría desde el cuerpo de la solicitud
            // Realizamos la actualización en la base de datos
            connection.query('UPDATE categorias SET nombre = ? WHERE id = ?', [nuevoNombre, categoriaId], (error, results) => {
                if (error) {
                    console.error('Error al editar la categoría:', error);
                    return res.status(500).send(`
                        <h2>Error al editar la categoría</h2>
                        <p>Ocurrió un error al editar la categoría. Por favor, intenta nuevamente.</p>
                        <a href="/">Volver a la página principal</a>
                    `);
                } else {
                    this.categorias(req, res);
                    // console.log('Categoría actualizada con éxito');
                    // // Después de actualizar la categoría, consultamos nuevamente las categorías de la base de datos
                    // connection.query('SELECT * FROM categorias WHERE secretaria_id = ?', [req.session.secretaria], (error, categorias) => {
                    //     if (error) {
                    //         console.error('Error al consultar las categorías:', error);
                    //         return res.status(500).send(`
                    //             <h2>Error interno del servidor al obtener las categorías actualizadas</h2>
                    //             <p>Ocurrió un error al obtener las categorías actualizadas. Por favor, intenta nuevamente.</p>
                    //             <a href="/">Volver a la página principal</a>
                    //         `);
                    //     } else {
                    //         // Renderizamos la vista 'categorias.ejs' nuevamente con las categorías actualizadas
                    //         res.render('categorias', {
                    //             login: true,
                    //             nombre: req.session.nombre,
                    //             secretaria: req.session.secretaria,
                    //             categorias: categorias,
                    //             id_usuario: req.session.id_usuario
                    //         });
                    //     }
                    // });
                }
            });
        } catch (error) {
            // Si hay un error en el código síncrono, enviar una respuesta 500 Internal Server Error
            console.error('Error en la actualización de la categoría:', error);
            return res.status(500).send(`
                <h2>Error interno del servidor</h2>
                <p>Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.</p>
                <a href="/">Volver a la página principal</a>
            `);
        }
    } else {
        // Si el usuario no está autenticado, redirigir al formulario de inicio de sesión
        res.render('login');
    }
};

//VER CATEGORÍAS
exports.categorias = (req, res) => {
    if (req.session.loggedin) {
        // Consulta SQL para seleccionar los nombres de las categorías con secretaria_id igual al req.session.secretaria
        connection.query(categoriasSelect, [req.session.secretaria], (error, results) => {
            if (error) {
                console.error('Error al obtener las categorías:', error);
                res.status(500).send(`
                    <h2>Error al obtener las categorías</h2>
                    <p>Ocurrió un error al obtener las categorías. Por favor, intenta nuevamente.</p>
                    <a href="/">Volver a la página principal</a>
                `);
            } else {
                // Renderiza la plantilla 'categorias.ejs' y pasa los resultados de la consulta
                res.render('categorias', {
                    login: true,
                    nombre: req.session.nombre,
                    secretaria: req.session.secretaria,
                    id_usuario: req.session.id_usuario,
                    nombreSecretaria: req.session.nombreSecretaria,
                    categorias: results // Aquí pasa los resultados de la consulta
                });
            }
        });
    } else {
        res.render('login');
    }
};

//BORRAR CATEGORÍA 
exports.borrarCategoria = (req, res) => {
    if(req.session.loggedin){
        const categoriaId = req.body.id; // Obtenemos el ID de la categoría desde el cuerpo de la solicitud
        // Realizamos la actualización en la base de datos
        connection.query('DELETE FROM categorias WHERE id = ?', [categoriaId], (error, results) => {
            if (error) {
                throw error;
            } else {
                console.log('Categoría borrada con éxito');
                this.categorias(req, res);
                // Después de borrar la categoría, consultamos nuevamente las categorías de la base de datos
                // connection.query('SELECT * FROM categorias WHERE secretaria_id = ?', [req.session.secretaria], (error, categorias) => {
                //     if (error) {
                //         throw error;
                //     } else {
                //         // Renderizamos la vista 'categorias.ejs' nuevamente con las categorías actualizadas
                //         res.render('categorias', {
                //             login: true,
                //             nombre: req.session.nombre,
                //             secretaria: req.session.secretaria,
                //             categorias: categorias,
                //             id_usuario: req.session.id_usuario
                //         });
                //     }
                // });
            }
        });
    }else{
        res.render('login');
    }
};


/* 
//////////////////////
CONTROLLERS FACTURAS
//////////////////////
*/

//VER FACTURAS
exports.facturas = (req, res) => {
    if (req.session.loggedin) {
        // Consulta SQL para seleccionar las facturas asociadas al usuario logueado
        connection.query(facturasSelect, [req.session.secretaria], (error, resultsFacturas) => {  
            if (error) {
                throw error;
            } else {
                // Consulta SQL para seleccionar las categorías asociadas a la secretaría del usuario logueado
                connection.query(categoriasSelect, [req.session.secretaria], (error, resultsCategorias) => {
                    if (error) {
                        throw error;
                    } else {
                        // Filtrar estados únicos de las facturas
                        const estadosUnicos = [...new Set(resultsFacturas.map(factura => factura.estado))];
                        // Renderiza la plantilla 'facturas.ejs' y pasa los resultados de ambas consultas
                        res.render('facturas', {
                            login: true,
                            nombre: req.session.nombre,
                            id_usuario: req.session.id_usuario,
                            secretaria: req.session.secretaria,
                            nombreSecretaria: req.session.nombreSecretaria,
                            facturas: resultsFacturas, // Resultados de la consulta de facturas
                            categorias: resultsCategorias, // Resultados de la consulta de categorías
                            estados: estadosUnicos
                        });
                        //console.log(resultsFacturas);
                    }
                });
            }
        });
    } else {
        res.render('login');
        // res.render('index', {
        //     login: false,
        //     nombre: 'Debe iniciar sesión',
        //     secretaria: ''
        // });
    }
};

//CARGAR FACTURAS
exports.cargarFactura = (req, res) => {
    if(req.session.loggedin){
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
                    const fechaActual = new Date();
                    const fechaLocal = new Date(fechaActual.getTime() - (fechaActual.getTimezoneOffset() * 60000));
                    const fechaFormateada = fechaLocal.toISOString().slice(0, 19).replace('T', ' ');
                    const sql = 'INSERT INTO facturas (fecha_carga, nombre_factura, categoria_id, monto, estado, usuario_id, archivo_factura) VALUES (?, ?, ?, ?, ?, ?, ?)';
                    // Insertar los datos de la factura en la base de datos
                    connection.query(sql, [fechaFormateada, nombreFactura, categoriaId, monto, estado, usuarioId, newPath], (err, result) => {
                        if (err) { // Manejar errores si ocurren al insertar datos en la base de datos
                            console.error('Error al insertar datos en la base de datos:', err);
                            res.status(500).send({ error: 'Error interno del servidor' });
                        } else { // Si los datos se insertaron correctamente en la base de datos
                            console.log('Datos insertados correctamente en la base de datos');
                            res.redirect('facturas'); // Redirigir a la página de inicio después de cargar la factura
                        }
                    });
                }
            });
        } else { // Si no se ha subido ningún archivo
            res.status(400).send({ error: 'No se pudo subir el archivo' }); // Enviar un error al cliente
        }
    }else{
        res.render('login');
    }
};

//DESCARGAR PDF FACTURA
exports.descargarArchivo = (req, res) => {
    if(req.session.loggedin){
        const fileId = req.params.id; // Obtener el ID del archivo de la solicitud

        // Consultar la base de datos para obtener la información del archivo y su nombre
        const sql = 'SELECT nombre_factura, archivo_factura FROM facturas WHERE id = ?';
        connection.query(sql, [fileId], (err, result) => {
            if (err) { // Manejar errores si ocurren al realizar la consulta en la base de datos
                console.error('Error al obtener el archivo de la base de datos:', err);
                res.status(500).send({ error: 'Error interno del servidor' });
            } else {
                if (result.length > 0) { // Si se encontró el archivo en la base de datos
                    const nombreFactura = result[0].nombre_factura; // Obtener el nombre de la factura
                    const rutaArchivo = result[0].archivo_factura; // Obtener la ruta del archivo
                    // Configurar los encabezados de la respuesta para indicar que es un archivo PDF
                    res.setHeader('Content-Type', 'application/pdf');
                    // Utilizar el nombre de la factura como nombre de archivo para la descarga
                    // res.setHeader('Content-Disposition', `attachment; filename="${nombreFactura}.pdf"`);
                    res.setHeader('Content-Disposition', `attachment; filename="${nombreFactura}"`);
                    // enviar el contenido del archivo como respuesta
                    fs.createReadStream(rutaArchivo).pipe(res);
                } else { // Si no se encontró el archivo con el ID proporcionado
                    res.status(404).send({ error: 'Archivo no encontrado' }); // Enviar un error
                }
            }
        });
    }else{
        res.render('login');
    }
};

//BORRAR FACTURA 
exports.borrarFactura = (req, res) => {
    if(req.session.loggedin){
        const facturaId = req.body.id; // Obtenemos el ID de la factura desde el cuerpo de la solicitud
        // Realizamos la actualización en la base de datos
        connection.query('DELETE FROM facturas WHERE id = ?', [facturaId], (error, results) => {
            if (error) {
                throw error;
            } else {
                console.log('Factura borrada con éxito');
                // Después de borrar la factura, consultamos nuevamente las facturas de la base de datos
                connection.query('SELECT * FROM facturas WHERE usuario_id = ?', [req.session.secretaria], (error, facturas) => {
                    if (error) {
                        throw error;
                    } else {
                        connection.query(facturasSelect, [req.session.secretaria], (error, resultsFacturas) => {  
                            if (error) {
                                throw error;
                            } else {
                                // Consulta SQL para seleccionar las categorías asociadas a la secretaría del usuario logueado
                                connection.query(categoriasSelect, [req.session.secretaria], (error, resultsCategorias) => {
                                    if (error) {
                                        throw error;
                                    } else {
                                        // Filtrar estados únicos de las facturas
                                        const estadosUnicos = [...new Set(resultsFacturas.map(factura => factura.estado))];
                                        // Renderiza la plantilla 'facturas.ejs' y pasa los resultados de ambas consultas
                                        res.render('facturas', {
                                            login: true,
                                            nombre: req.session.nombre,
                                            id_usuario: req.session.id_usuario,
                                            secretaria: req.session.secretaria,
                                            facturas: resultsFacturas, // Resultados de la consulta de facturas
                                            categorias: resultsCategorias, // Resultados de la consulta de categorías
                                            estados: estadosUnicos,
                                            nombreSecretaria: req.session.nombreSecretaria
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }else{
        res.render('login');
    }
};

/* 
//////////////////////
CONTROLLERS ANALITICAS
//////////////////////
*/

exports.analiticas = (req, res) => {
    if (req.session.loggedin) {
        connection.query(queryAnaliticas, (error, results) => {  
            if (error) {
                throw error;
            } else {
                // Renderiza la plantilla 'analiticas.ejs' y pasa los resultados de la consulta
                res.render('analiticas', {
                    login: true,
                    nombre: req.session.nombre,
                    id_usuario: req.session.id_usuario,
                    secretaria: req.session.secretaria,
                    nombreSecretaria: req.session.nombreSecretaria,
                    facturas: results // Resultados de la consulta de facturas
                });
            }
        });
    } else {
        res.render('login');
        // res.render('index', {
        //     login: false,
        //     nombre: 'Debe iniciar sesión',
        //     secretaria: ''
        // });
    }
}
exports.aceptarFactura = (req, res)=>{
    if(req.session.loggedin){
        const idFactura = req.params.id;
        const estado = 'aceptado';
        connection.query('UPDATE facturas SET estado = ? WHERE id = ?', [estado, idFactura], (error, results1)=>{
            if(error){
                throw error;
            }else{
                connection.query(queryAnaliticas,
                (error, results2) => {
                    if (error) {
                        throw error;
                    } else {
                        res.render('analiticas', {
                            login: true,
                            nombre: req.session.nombre,
                            id_usuario: req.session.id_usuario,
                            secretaria: req.session.secretaria,
                            facturas: results2, // Resultados de la consulta de facturas
                            nombreSecretaria: req.session.nombreSecretaria
                        });
                    }
                });
            }
        });
    }else{
        res.render('login');
    }
}
exports.rechazarFactura = (req, res)=>{
    if(req.session.loggedin){
        const idFactura = req.params.id;
        const estado = 'denegado';
        connection.query('UPDATE facturas SET estado = ? WHERE id = ?', [estado, idFactura], (error, results1)=>{
            if(error){
                throw error;
            }else{
                connection.query(queryAnaliticas,
                (error, results2) => {
                    if (error) {
                        throw error;
                    } else {
                        res.render('analiticas', {
                            login: true,
                            nombre: req.session.nombre,
                            id_usuario: req.session.id_usuario,
                            secretaria: req.session.secretaria,
                            facturas: results2, // Resultados de la consulta de facturas
                            nombreSecretaria: req.session.nombreSecretaria
                        });
                    }
                });
            }
        });
    }else{
        res.render('login');
    }
}

///////////////////INGRESO
exports.ingresoGanancia = (req, res)=>{
    if (req.session.loggedin) {
        //Modificación de la Query para que me formatee la fecha de ingreso
        connection.query('SELECT ingresos.id_ingreso, ingresos.fecha_ingreso, DATE_FORMAT(ingresos.fecha_ingreso, "%d/%m/%Y") AS fecha_ingreso_formateada, ingresos.nombre_ingreso, categorias.nombre AS nombre_categoria, ingresos.monto, usuarios.nombres AS nombre_usuario FROM ingresos JOIN categorias ON ingresos.categoria_id = categorias.id JOIN usuarios ON ingresos.usuario_id = usuarios.id WHERE ingresos.secretaria_id = ? ORDER BY ingresos.fecha_ingreso DESC', [req.session.secretaria], (error, resultsIngresos) => {
            if (error) {
                throw error;
            }else{
                connection.query(categoriasSelect, [req.session.secretaria], (error, resultsCategorias) => {
                    if (error) {
                        throw error;
                    } else {
                        res.render('ingresos', {
                        login: true,
                        nombre: req.session.nombre,
                        id_usuario: req.session.id_usuario,
                        secretaria: req.session.secretaria,
                        ingresos: resultsIngresos,
                        nombreSecretaria: req.session.nombreSecretaria,
                        categorias: resultsCategorias
                        });
                        console.log(`Nombre: ${req.session.nombre}, ID Usuario: ${req.session.id_usuario}, Secretaria: ${req.session.secretaria}, Resultados de ingresos:`, resultsIngresos);
                    }
                });
            }
        });
    }else{
        res.render('login');
        // res.render('index', {
        //     login: false,
        //     nombre: 'Debe iniciar sesión',
        //     secretaria: ''
        // });
    }
}
exports.cargarIngreso = (req, res) => {
    if (req.session.loggedin) {
        const { nombreIngreso, categoria, monto } = req.body;
        
        // Obtener la fecha y hora actual formateada
        const fechaActual = new Date();
        const fechaLocal = new Date(fechaActual.getTime() - (fechaActual.getTimezoneOffset() * 60000));
        const fechaFormateada = fechaLocal.toISOString().slice(0, 19).replace('T', ' ');

        // Insertar el ingreso en la base de datos
        connection.query('INSERT INTO ingresos (nombre_ingreso, categoria_id, monto, usuario_id, fecha_ingreso, secretaria_id) VALUES (?, ?, ?, ?, ?, ?)', 
            [nombreIngreso, categoria, monto, req.session.id_usuario, fechaFormateada, req.session.secretaria], 
            (error, results) => {
                if (error) {
                    throw error;
                } else {
                    this.ingresoGanancia(req, res);
                }
            }
        );
    } else {
        res.render('login');
        // res.render('index', {
        //     login: false,
        //     nombre: 'Debe iniciar sesión',
        //     secretaria: ''
        // });
    }
};
exports.tablaGrafica = (req,res)=>{
    if (req.session.loggedin) {
        connection.query('SELECT fecha, nombre, tipo, nombre_secretaria, nombre_categoria, nombre_usuario, IF(tipo = "egreso", monto, 0) AS perdida, IF(tipo = "ingreso", monto, 0) AS ganancia FROM (SELECT f.fecha_carga AS fecha, f.nombre_factura AS nombre, "egreso" AS tipo, s.nombre AS nombre_secretaria, c.nombre AS nombre_categoria, u.nombres AS nombre_usuario, f.monto AS monto FROM facturas f JOIN categorias c ON f.categoria_id = c.id JOIN secretarias s ON c.secretaria_id = s.id JOIN usuarios u ON f.usuario_id = u.id UNION ALL SELECT i.fecha_ingreso AS fecha, i.nombre_ingreso AS nombre, "ingreso" AS tipo, s.nombre AS nombre_secretaria, c.nombre AS nombre_categoria, u.nombres AS nombre_usuario, i.monto AS monto FROM ingresos i JOIN categorias c ON i.categoria_id = c.id JOIN secretarias s ON i.secretaria_id = s.id JOIN usuarios u ON i.usuario_id = u.id) AS combined_data ORDER BY fecha', (error, results)=>{
            if (error) {
                throw error;
            }else{
                //res.send(results);
                res.render('tabla_grafica', {
                   login: true,
                   nombre: req.session.nombre,
                   id_usuario: req.session.id_usuario,
                   secretaria: req.session.secretaria,
                   nombreSecretaria: req.session.nombreSecretaria,
                   resultados: results
                });
                  console.log(`Nombre: ${req.session.nombre}, ID Usuario: ${req.session.id_usuario}, Secretaria: ${req.session.secretaria}, Objeto:`, results);
            }
        });
    }else{
        res.render('login');
    }
}
exports.facturasActivas = (req, res)=>{
    if(req.session.loggedin){
        connection.query(facturasAceptadas, (error, results)=>{
            if(error){
                throw error;
            }else{
                // res.send(results);
                res.render('facturas-activas', {
                    login: true,
                    nombre: req.session.nombre,
                    id_usuario: req.session.id_usuario,
                    secretaria: req.session.secretaria,
                    nombreSecretaria: req.session.nombreSecretaria,
                    resultados: results
                });
                //console.log(results);
            }
        });
    }else{
        res.render('login');
    }
}
exports.facturasActivasBL = (req, res)=>{
    if(req.session.loggedin){
        const idFactura = req.body.id;
        const visibilidad = 'no visible';
        connection.query('UPDATE facturas SET visibilidad = ? WHERE id = ?', [visibilidad, idFactura], (error, results)=>{
            if(error){
                throw error;
            }else{
                console.log(results);
                this.facturasActivas(req, res);
            }
        });
    }else{
        res.render('login');
    }
}