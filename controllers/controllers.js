const connection = require('../database/db');
const fs = require('fs'); // Importar FileSystem para operaciones de archivos
const path = require('path'); // Importar Path para manejar rutas de archivos
const bcryptjs = require('bcryptjs'); 
const { render } = require('ejs');
const Swal = require('sweetalert2');
const { connect } = require('http2');
const queryAnaliticas = 'SELECT f.*, DATE_FORMAT(f.fecha_carga, "%d/%m/%Y") AS fecha_formateada, u.nombres AS nombre_usuario, c.nombre AS nombre_categoria, sec.nombre AS nombre_secretaria FROM facturas f JOIN usuarios u ON f.usuario_id = u.id JOIN categorias c ON f.categoria_id = c.id JOIN secretarias sec ON u.secretaria_id = sec.id WHERE f.estado = "en proceso"';
const facturasAceptadas = 'SELECT f.*, DATE_FORMAT(f.fecha_carga, "%d/%m/%Y") AS fecha_formateada, u.nombres AS nombre_usuario, c.nombre AS nombre_categoria, sec.nombre AS nombre_secretaria FROM facturas f JOIN usuarios u ON f.usuario_id = u.id JOIN categorias c ON f.categoria_id = c.id JOIN secretarias sec ON u.secretaria_id = sec.id WHERE f.estado = "aceptado" AND f.visibilidad = "visible" ORDER BY f.fecha_carga DESC';
const facturasSelect = 'SELECT f.*, DATE_FORMAT(f.fecha_carga, "%d/%m/%Y") AS fecha_formateada, u.nombres AS nombre_usuario, c.nombre AS nombre_categoria, sec.nombre AS nombre_secretaria FROM facturas f JOIN usuarios u ON f.usuario_id = u.id JOIN categorias c ON f.categoria_id = c.id JOIN secretarias sec ON u.secretaria_id = sec.id WHERE u.secretaria_id = ? AND f.visibilidad = "visible"';
const categoriasSelect = 'SELECT id, nombre FROM categorias WHERE secretaria_id = ?';
const sumaMontosFacturasAct =  `
SELECT 
    (SELECT SUM(f.monto) 
     FROM facturas f 
     WHERE f.estado = "aceptado" AND f.visibilidad = "visible") AS total_general,
    (SELECT SUM(f.monto) 
     FROM facturas f 
     WHERE f.estado = "aceptado" AND f.visibilidad = "visible" AND f.destino = "fundacion") AS total_fundacion,
    (SELECT SUM(f.monto) 
     FROM facturas f 
     WHERE f.estado = "aceptado" AND f.visibilidad = "visible" AND f.destino = "universidad") AS total_universidad;
`;
// const sumaGeneralFacturasVisibles = 'SELECT SUM(f.monto) AS total_general FROM facturas f WHERE f.estado = "aceptado" AND f.visibilidad = "visible";'
// const sumaFundacionFacturasVisibles = 'SELECT SUM(f.monto) AS total_fundacion FROM facturas f WHERE f.estado = "aceptado" AND f.visibilidad = "visible" AND f.destino = "fundacion";'
// const sumaUniversidadFacturasVisibles = 'SELECT SUM(f.monto) AS total_universidad FROM facturas f WHERE f.estado = "aceptado" AND f.visibilidad = "visible" AND f.destino = "universidad";'
function handleHttpResponse(res, statusCode, message) {
    res.status(statusCode).render('error', {
        statusCode: statusCode,
        message: message
    });
}
//CREAR USUARIO
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
            return handleHttpResponse(res, 500, 'Error interno del servidor, ha ocurrido un error al encriptar la clave');
        }
        // Verificar si el usuario ya existe
        connection.query('SELECT COUNT(*) AS count FROM usuarios WHERE usuario = ?', [usuario], (selectError, countResult) => {
            if (selectError) {
                console.error('Error al verificar usuario existente:', selectError);
                return handleHttpResponse(res, 500, 'Error interno del servidor, ha ocurrido un error al verificar el usuario');
            }
            // Si el usuario ya existe, enviar una respuesta al cliente
            if (countResult[0].count > 0) {
                return handleHttpResponse(res, 400, `El usuario '${usuario}' ya existe. Por favor, elige otro nombre de usuario.`);
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
                    return handleHttpResponse(res, 500,`Error interno del servidor, ha ocurrido un error al crear la cuenta: '${insertError}'`);
                }
                // Obtener la lista de secretarías
                connection.query('SELECT * FROM secretarias', (selectError, resultsSecretarias) => {
                    if (selectError) {
                        console.error('Error al obtener secretarías:', selectError);
                        return handleHttpResponse(res, 500, `Error interno del servidor, ha ocurrido un error al mostrar las secretarias`)
                    }
                    // Encontrar el nombre de la secretaría
                    const nombreSecretaria = resultsSecretarias.find(sec => sec.id === parseInt(secretaria)).nombre;
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
                    console.log(results);
                    //console.log(`APP.POST "/register". Se ha registrado el usuario: ${nombres} en la secretaria: ${nombreSecretaria}`);
                    //console.log('Redireccionando hacia index.ejs basándose en ruta: "vacio" y en sweetAlert en registro.ejs');
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
                //console.log('Autentificación correcta del usuario: ' + req.session.nombre + ' perteneciente a la secretaria: ' + req.session.nombreSecretaria);
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
                   
                    } else if (req.session.secretaria == '14' || req.session.secretaria == '13'){
                        // this.facturasActivas(req, res);
                        res.redirect('facturas-activas');
                    }else{
                    //console.log(req.session.secretaria);
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
                        return handleHttpResponse(res, 400, 'Ya existe una categoría con el mismo nombre para la secretaria especificada');
                    } else {
                        return handleHttpResponse(res, 500, 'Ocurrió un error al procesar su solicitud, por favor intente nuevamente.')
                    }
                } else {
                    //console.log('Categoría creada con éxito: ', nombre);
                    //this.categorias(req, res);
                    res.redirect('categorias?alertcreate=true')
                }
            });
        } catch (error) {
            // Si hay un error en el código síncrono, enviar una respuesta 500 Internal Server Error
            console.error('Error en la creación de categoría:', error);
            return handleHttpResponse(res, 500, 'Ocurrió un error al procesar su solicitud, por favor intente nuevamente');
        }
    } else {
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
                    return handleHttpResponse(res, 500, 'Ocurrió un error al editar la categoría. Por favor, intente nuevamente');
                } else {
                    this.categorias(req, res);
                }
            });
        } catch (error) {
            // Si hay un error en el código síncrono, enviar una respuesta 500 Internal Server Error
            console.error('Error en la actualización de la categoría:', error);
            return handleHttpResponse(res, 500, 'Ocurrió un error al procesar tu solicitud. Por favor, intente nuevamente');
        }
    } else {
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
                return handleHttpResponse(res, 500, 'Ocurrió un error al obtener las categorías. Por favor, intente nuevamente o comuníquese con el soporte');
            } else {
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
        const categoriaId = req.body.id;
        // Primero, eliminamos las filas dependientes en `ingresos`
        connection.query('DELETE FROM ingresos WHERE categoria_id = ?', [categoriaId], (error, results) => {
            if (error) {
                console.error('Error al borrar filas dependientes en ingresos', error);
                return handleHttpResponse(res, 500, 'Ocurrió un error al borrar las filas dependientes en ingresos, intente nuevamente o comuníquese con el soporte');
            }
            // Luego, eliminamos la categoría
            connection.query('DELETE FROM categorias WHERE id = ?', [categoriaId], (error, results) => {
                if (error) {
                    console.error('Error al borrar categoría', error);
                    return handleHttpResponse(res, 500, 'Ocurrió un error al borrar la categoría, intente nuevamente o comuníquese con el soporte');
                } else {
                    //('Categoría borrada con éxito');
                    // this.categorias(req, res);
                    res.redirect('categorias');
                }
            });
        });
    } else {
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
        connection.query(facturasSelect, [req.session.secretaria], (errorFacturas, resultsFacturas) => {  
            if (errorFacturas) {
                console.error('Error al obtener las facturas', errorFacturas);
                return handleHttpResponse(res, 500, 'Error al obtener las facturas, por favor comuníquese con soporte');
            } else {
                // Consulta SQL para seleccionar las categorías asociadas a la secretaría del usuario logueado
                connection.query(categoriasSelect, [req.session.secretaria], (errorCategorias, resultsCategorias) => {
                    if (errorCategorias) {
                        console.error('Error al obtener categorías: ', errorCategorias);
                        return handleHttpResponse(res, 500, 'Error al obtener las categorias. Por favor comuníquese con soporte');
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
                    }
                });
            }
        });
    } else {
        res.render('login');
    }
};

//CARGAR FACTURAS
exports.cargarFactura = (req, res) => {
    if (req.session.loggedin) {
        const uploadedFile = req.files['pdf'] ? req.files['pdf'][0] : null; // Obtener el archivo de la factura principal

        if (uploadedFile) { // Verificar si se ha subido un archivo
            const newPath = path.join('uploads', uploadedFile.originalname); // Construir la ruta completa del nuevo archivo

            // Renombrar el archivo en el sistema de archivos
            fs.rename(uploadedFile.path, newPath, (error) => {
                if (error) { // Manejar errores si ocurren al renombrar el archivo
                    console.error('Error al renombrar el archivo:', error);
                    return handleHttpResponse(res, 500, 'Error interno del servidor al renombrar el archivo. Por favor comuníquese con soporte.');
                } else { // Si el archivo se ha renombrado correctamente
                    const fechaActual = new Date();
                    const fechaLocal = new Date(fechaActual.getTime() - (fechaActual.getTimezoneOffset() * 60000));
                    const fechaFormateada = fechaLocal.toISOString().slice(0, 19).replace('T', ' ');

                    // Datos de la factura
                    const nombreFactura = uploadedFile.originalname; // Usar el nombre original del archivo de la factura
                    const categoriaId = req.body.categoria;
                    const monto = req.body.monto;
                    const estado = 'en proceso'; // Estado por defecto
                    const usuarioId = req.body.idUsuario;
                    const destino = req.body.destino;

                    const sql = 'INSERT INTO facturas (fecha_carga, nombre_factura, categoria_id, monto, estado, usuario_id, archivo_factura, destino) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                    
                    // Insertar los datos de la factura en la base de datos
                    connection.query(sql, [fechaFormateada, nombreFactura, categoriaId, monto, estado, usuarioId, newPath, destino], (err, result) => {
                        if (err) { // Manejar errores si ocurren al insertar datos en la base de datos
                            console.error('Error al insertar datos en la base de datos:', err);
                            return handleHttpResponse(res, 500, 'Error interno del servidor al insertar los datos en la base de datos.');
                        } else { // Si los datos se insertaron correctamente en la base de datos
                            const facturaId = result.insertId; // Obtener el ID de la factura insertada

                            // Ahora insertar la documentación anexa, si existe
                            const documentacionAnexa = [
                                req.files['documentacionAnexa'] ? req.files['documentacionAnexa'][0] : null,
                                req.files['documentacionAnexaExtra1'] ? req.files['documentacionAnexaExtra1'][0] : null,
                                req.files['documentacionAnexaExtra2'] ? req.files['documentacionAnexaExtra2'][0] : null,
                                req.files['documentacionAnexaExtra3'] ? req.files['documentacionAnexaExtra3'][0] : null
                            ];

                            // Crear la carpeta 'uploads/documentacion_anexa' si no existe
                            const documentacionAnexaDir = path.join('uploads', 'documentacion_anexa');
                            if (!fs.existsSync(documentacionAnexaDir)) {
                                fs.mkdirSync(documentacionAnexaDir, { recursive: true });
                            }

                            // Construir rutas completas para los documentos anexos
                            const rutasDocumentacionAnexa = documentacionAnexa.map(doc => doc ? path.join(documentacionAnexaDir, doc.originalname) : null);

                            if (rutasDocumentacionAnexa.some(doc => doc !== null)) {
                                // Llamar a la función para insertar la documentación anexa
                                insertarDocumentacionAnexa(facturaId, rutasDocumentacionAnexa, documentacionAnexa, res);
                            } else {
                                res.redirect('facturas?success=true');
                            }
                        }
                    });
                }
            });
        } else { // Si no se ha subido ningún archivo
            return handleHttpResponse(res, 400, 'No se ha podido subir ningún archivo');
        }
    } else {
        res.render('login');
    }
};

// Función para mover los archivos de la documentación anexa
function insertarDocumentacionAnexa(facturaId, rutasDocumentacionAnexa, documentacionAnexa, res) {
    // Mover archivos
    documentacionAnexa.forEach((doc, index) => {
        if (doc) {
            fs.rename(doc.path, rutasDocumentacionAnexa[index], (error) => {
                if (error) {
                    console.error('Error al mover documentación anexa:', error);
                }
            });
        }
    });

    // Insertar en la base de datos
    const sql = `INSERT INTO documentacion_anexa (factura_id, documento_anexo, documento_anexo_extra_1, documento_anexo_extra_2, documento_anexo_extra_3)
                 VALUES (?, ?, ?, ?, ?)`;

    connection.query(sql, [
        facturaId, 
        rutasDocumentacionAnexa[0], 
        rutasDocumentacionAnexa[1], 
        rutasDocumentacionAnexa[2], 
        rutasDocumentacionAnexa[3]
    ], (err) => {
        if (err) {
            console.error('Error al insertar documentación anexa en la base de datos:', err);
            return handleHttpResponse(res, 500, 'Error interno del servidor al insertar la documentación anexa.');
        } else {
            res.redirect('facturas?success=true'); // Redirigir a la página de inicio después de cargar la factura
        }
    });
}


//DESCARGAR PDF FACTURA
exports.descargarArchivo = (req, res) => {
    if(req.session.loggedin){
        const fileId = req.params.id; // Obtener el ID del archivo de la solicitud

        // Consultar la base de datos para obtener la información del archivo y su nombre
        const sql = 'SELECT nombre_factura, archivo_factura FROM facturas WHERE id = ?';
        connection.query(sql, [fileId], (err, result) => {
            if (err) { // Manejar errores si ocurren al realizar la consulta en la base de datos
                console.error('Error al obtener el archivo de la base de datos:', err);
                return handleHttpResponse(res, 500, 'Error interno del servidor al obtener el archivo de la base de datos. Por favor comuníquese con soporte.');
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
                    return handleHttpResponse(res, 400, 'Archivo no encontrado.');
                }
            }
        });
    }else{
        res.render('login');
    }
};
// Controlador para descargar la documentación anexa
exports.descargarDocumentacionAnexa = (req, res) => {
    if (req.session.loggedin) {
        const facturaId = req.params.id; // ID de la factura
        const anexoNum = req.query.anexo; // Número del documento anexo (1, 2, 3, etc.)

        // Consulta para obtener la documentación anexa
        const sqlAnexo = 'SELECT * FROM documentacion_anexa WHERE factura_id = ?';
        connection.query(sqlAnexo, [facturaId], (err, result) => {
            if (err) {
                console.error('Error al obtener la documentación anexa:', err);
                return handleHttpResponse(res, 500, 'Error interno del servidor al obtener la documentación anexa.');
            }
            if (result.length > 0) {
                let archivoAnexo = '';
                switch (anexoNum) {
                    case '1':
                        archivoAnexo = result[0].documento_anexo;
                        break;
                    case '2':
                        archivoAnexo = result[0].documento_anexo_extra_1;
                        break;
                    case '3':
                        archivoAnexo = result[0].documento_anexo_extra_2;
                        break;
                    case '4':
                        archivoAnexo = result[0].documento_anexo_extra_3;
                        break;
                    default:
                        return handleHttpResponse(res, 400, 'Documento anexo no encontrado.');
                }

                if (archivoAnexo) {
                    // Extraemos el nombre del archivo desde la ruta completa
                    nombreArchivo = archivoAnexo.split('\\').pop().split('/').pop(); // Funciona con ambos tipos de separadores

                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
                    fs.createReadStream(archivoAnexo).pipe(res);
                } else {
                    return handleHttpResponse(res, 400, 'Documento anexo no encontrado.');
                }
            } else {
                return handleHttpResponse(res, 400, 'No se encontraron documentos anexos para esta factura.');
            }
        });
    } else {
        res.render('login');
    }
};

// Controlador para obtener la documentación anexa
exports.obtenerDocumentacionAnexa = (req, res) => {
    const facturaId = req.params.id;

    const sqlAnexo = 'SELECT documento_anexo, documento_anexo_extra_1, documento_anexo_extra_2, documento_anexo_extra_3 FROM documentacion_anexa WHERE factura_id = ?';
    connection.query(sqlAnexo, [facturaId], (err, result) => {
        if (err) {
            console.error('Error al obtener la documentación anexa:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        if (result.length > 0) {
            // Reemplaza las barras invertidas por barras normales
            const documentacionAnexa = result[0];
            documentacionAnexa.documento_anexo = documentacionAnexa.documento_anexo?.replace(/\\/g, '/');
            documentacionAnexa.documento_anexo_extra_1 = documentacionAnexa.documento_anexo_extra_1?.replace(/\\/g, '/');
            documentacionAnexa.documento_anexo_extra_2 = documentacionAnexa.documento_anexo_extra_2?.replace(/\\/g, '/');
            documentacionAnexa.documento_anexo_extra_3 = documentacionAnexa.documento_anexo_extra_3?.replace(/\\/g, '/');

            res.json({ documentacionAnexa });
        } else {
            res.json({ documentacionAnexa: [] });
        }
    });
};



//BORRAR FACTURA 
exports.borrarFactura = (req, res) => {
    if(req.session.loggedin){
        const facturaId = req.body.id; 
        connection.query('DELETE FROM facturas WHERE id = ?', [facturaId], (error, results) => {
            if (error) {
                console.error('Error al borrar la factura: ', error);
                return handleHttpResponse(res, 500, 'Error al borrar la factura. Por favor comuníquese con el soporte');
            } else {
                //console.log('Factura borrada con éxito');
                // Después de borrar la factura, consultamos nuevamente las facturas de la base de datos
                 connection.query(facturasSelect, [req.session.secretaria], (error, resultsFacturas) => {  
                     if (error) {
                         console.error('Error al consultar las facturas: ', error);
                         return handleHttpResponse(res, 500, 'Error interno del servidor al consultar las facturas. Por favor comuníquese con el soporte');
                     } else {
                         // Consulta SQL para seleccionar las categorías asociadas a la secretaría del usuario logueado
                         connection.query(categoriasSelect, [req.session.secretaria], (error, resultsCategorias) => {
                             if (error) {
                                 console.error('Error al consultar con las categorías: ', error);
                                 return handleHttpResponse(res, 500, 'Error interno del servidor al consultar con las categorías. Por favor comuníquese con el soporte');
                             } else {
                                 // Renderiza la plantilla 'facturas.ejs' y pasa los resultados de ambas consultas
                                 res.redirect('facturas?borrado=true');
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
    if (req.session.loggedin && req.session.secretaria == '1') {
        connection.query(queryAnaliticas, (error, results) => {  
            if (error) {
                console.error('Ha ocurrido un error interno al consultar con la base de datos: ', error);
                return handleHttpResponse(res, 500, 'Error interno del servidor al consultar con las facturas en proceso. Por favor comuníquese con el soporte');
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
    }
}
exports.aceptarFactura = (req, res) => {
    if (req.session.loggedin) {
        const idFactura = req.params.id;
        const estado = 'aceptado';
        const codigo = req.query.codigo; // Obtener el código del cuerpo de la solicitud

        if (!codigo) {
            return handleHttpResponse(res, 400, 'Código no proporcionado.');
        }

        // Realizar la actualización en la base de datos
        console.log(codigo);
        connection.query(
            'UPDATE facturas SET estado = ?, codigo = ? WHERE id = ?',
            [estado, codigo, idFactura],
            (error, results1) => {
                if (error) {
                    console.error('Ha ocurrido un error al aceptar la factura: ', error);
                    return handleHttpResponse(res, 500, 'Error interno al cambiar el estado de la factura. Por favor comuníquese con el soporte');
                } else {
                 this.analiticas(req, res); // Llamar a la función de analíticas si es necesario
                }
            }
        );
    } else {
        res.render('login');
    }
}
exports.rechazarFactura = (req, res)=>{
    if(req.session.loggedin){
        const idFactura = req.params.id;
        const estado = 'denegado';
        connection.query('UPDATE facturas SET estado = ? WHERE id = ?', [estado, idFactura], (error, results1)=>{
            if(error){
                console.error('Ha ocurrido un error al rechazar la factura: ', error);
                return handleHttpResponse(res, 500, 'Error interno al cambiar el estado de la factura. Por favor comuníquese con el soporte');
            }else{
                this.analiticas(req, res);
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
                console.error('Error al consultar con los ingresos: ', error);
                return handleHttpResponse(res, 500, 'Error interno del servidor al consultar con la base de datos. Por favor comuníquese con el soporte');
            }else{
                connection.query(categoriasSelect, [req.session.secretaria], (error, resultsCategorias) => {
                    if (error) {
                        console.error('Error al consultar con las categorías en la base de datos: ', error);
                        return handleHttpResponse(res, 500, 'Error interno del servidor al consultar con la base de datos. Por favor comuníquese con el soporte');
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
                    }
                });
            }
        });
    }else{
        res.render('login');
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
                    console.error('Error al insertar el ingreso: ', error);
                    return handleHttpResponse(res, 500, 'Error interno del servidor al cargar el ingreso. Por favor comuníquese con el soporte');
                } else {
                    res.redirect('ingresos?success=true');
                    console.log(results);
                }
            }
        );
    } else {
        res.render('login');
    }
};
exports.editarIngreso = (req, res) => {
    if (req.session.loggedin) {
        const { editarIngreso, editarMontoIngreso, editarIdIngreso } = req.body;
        // Actualizar el ingreso en la base de datos
        connection.query(
            'UPDATE ingresos SET nombre_ingreso = ?, monto = ? WHERE id_ingreso = ?',
            [editarIngreso, editarMontoIngreso, editarIdIngreso],
            (error, results) => {
                if (error) {
                    console.error('Error al actualizar el ingreso: ', error);
                    return handleHttpResponse(res, 500, 'Error interno del servidor al actualizar el ingreso. Por favor comuníquese con el soporte');
                } else {
                    res.redirect('ingresos');
                }
            }
        );
    } else {
        res.render('login');
    }
};
exports.borrarIngreso = (req, res) => {
    if (req.session.loggedin) {
        const { borrarIdIngreso } = req.body;
        connection.query('DELETE FROM ingresos WHERE id_ingreso = ?', [borrarIdIngreso], (error, results) => {
            if (error) {
                console.error('Error al borrar el ingreso: ', error);
                return handleHttpResponse(res, 500, 'Error interno del servidor al borrar el ingreso. Por favor comuníquese con el soporte');
            } else {
                res.redirect('ingresos');
            }
        });
    } else {
        res.render('login');
    }
};
/////////////////////////////////////////////////////////////////////////////
exports.tablaGrafica = (req,res)=>{
    if (req.session.loggedin) {
        connection.query('SELECT fecha, nombre, tipo, nombre_secretaria, nombre_categoria, nombre_usuario, IF(tipo = "egreso", monto, 0) AS perdida, IF(tipo = "ingreso", monto, 0) AS ganancia FROM (SELECT f.fecha_carga AS fecha, f.nombre_factura AS nombre, "egreso" AS tipo, s.nombre AS nombre_secretaria, c.nombre AS nombre_categoria, u.nombres AS nombre_usuario, f.monto AS monto FROM facturas f JOIN categorias c ON f.categoria_id = c.id JOIN secretarias s ON c.secretaria_id = s.id JOIN usuarios u ON f.usuario_id = u.id WHERE f.estado = "aceptado" UNION ALL SELECT i.fecha_ingreso AS fecha, i.nombre_ingreso AS nombre, "ingreso" AS tipo, s.nombre AS nombre_secretaria, c.nombre AS nombre_categoria, u.nombres AS nombre_usuario, i.monto AS monto FROM ingresos i JOIN categorias c ON i.categoria_id = c.id JOIN secretarias s ON i.secretaria_id = s.id JOIN usuarios u ON i.usuario_id = u.id) AS combined_data ORDER BY fecha', (error, results)=>{
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
            }
        });
    }else{
        res.render('login');
    }
}
exports.facturasActivas = (req, res) => {
    if (req.session.loggedin) {
        connection.query(facturasAceptadas, (error, results) => {
            if (error) {
                console.error('Ha ocurrido un error al cargar las facturas activas (aceptadas): ', error);
                return handleHttpResponse(res, 500, 'Error al cargar las facturas aceptadas desde la base de datos. Por favor comuníquese con el soporte');
            } else {
                // res.send(results);
                connection.query(sumaMontosFacturasAct, (sumaMontosError, totalSumaMontos) => {
                    if (sumaMontosError) {
                        console.error('Ha ocurrido un error al sumar todas las facturas activas: ', sumaMontosError);
                        return handleHttpResponse(res, 500, 'Error al sumar todas las facturas activas. Por favor comuníquese con el soporte');
                    } else {   
                        // console.log(totalSumaMontos);
                        res.render('facturas-activas', {
                            login: true,
                            nombre: req.session.nombre,
                            id_usuario: req.session.id_usuario,
                            secretaria: req.session.secretaria,
                            nombreSecretaria: req.session.nombreSecretaria,
                            resultados: results,
                            totalGeneral: totalSumaMontos[0].total_general,
                            totalFundacion: totalSumaMontos[0].total_fundacion,
                            totalUniversidad: totalSumaMontos[0].total_universidad
                        });
                    }
                });
            }
        });
    } else {
        res.render('login');
    }
};
exports.facturasActivasBL = (req, res)=>{
    if(req.session.loggedin){
        const idFactura = req.body.id;
        const visibilidad = 'no visible';
        connection.query('UPDATE facturas SET visibilidad = ? WHERE id = ?', [visibilidad, idFactura], (error, results)=>{
            if(error){
                console.error('Ha ocurrido un error al dar de baja las facturas activas (aceptadas): ', error);
                return handleHttpResponse(res, 500, 'Error al dar de baja las facturas aceptadas desde la base de datos. Por favor comuníquese con el soporte');
            }else{
                res.redirect('facturas-activas');
            }
        });
    }else{
        res.render('login');
    }
}
exports.facturasActivasNExp = (req, res)=>{
    if(req.session.loggedin){
        const idFactura = req.body.idFactura;
        const n_expediente = req.body.numeroExpediente;
        connection.query('UPDATE facturas SET n_expediente = ? WHERE id = ?', [n_expediente, idFactura], (error, results)=>{
            if(error){
                console.error('Ha ocurrido un error al dar de baja las facturas activas (aceptadas): ', error);
                return handleHttpResponse(res, 500, 'Error al dar de baja las facturas aceptadas desde la base de datos. Por favor comuníquese con el soporte');
            }else{
                res.redirect('facturas-activas');
            }
        });
    }else{
        res.render('login');
    }
}
exports.fondosCategorias = (req, res)=>{
    if(req.session.loggedin){
        connection.query('SELECT * from categorias_fondos', (error, results)=>{
            if(error){
                console.error('Ha ocurrido un error al cargar los fondos disponibles: ', error);
                return handleHttpResponse(res, 500, 'Error interno al cargar las categorías de fondos');
            }else{
                res.render('fondos-categorias', {
                    login: true,
                    nombre: req.session.nombre,
                    id_usuario: req.session.id_usuario,
                    secretaria: req.session.secretaria,
                    nombreSecretaria: req.session.nombreSecretaria,
                    resultados: results
                })
            }
        });
    }else{
        res.render('login');
    }
}
exports.cargarFondoCategoria = (req, res)=>{
    if(req.session.loggedin){
        const nombreFondo = req.body.nombreFondo;
        const destino = req.body.destino;
        connection.query('INSERT INTO categorias_fondos (nombre_categoria_fondo, destino) VALUES (?, ?)', [nombreFondo, destino], (error, results)=>{
            if(error){
                console.error('Ha ocurrido un error al insertar el nuevo fondo ', error);
                return handleHttpResponse(res, 500, 'Error al insertar un nuevo fondo, recuerda revisar que no exista anteriormente');
            }else{
                res.redirect('fondos-categorias');
            }
        })
    }else{
        res.render('login');
    }
}
exports.fondosDisponibles = (req, res) => {
    if (req.session.loggedin) {
        const queryFondosDisponibles = `
            SELECT cf.nombre_categoria_fondo, 
                   fd.monto_peso, 
                   fd.monto_dolar, 
                   DATE_FORMAT(fd.fecha_carga, "%d/%m/%Y") AS fecha_carga_formateada, 
                   fd.id_fondo, 
                   cf.destino 
            FROM fondos_disponibles fd
            JOIN categorias_fondos cf ON fd.id_categoria_fondo = cf.id_categoria_fondo
            WHERE WEEK(fd.fecha_carga) = WEEK(CURDATE()) AND YEAR(fd.fecha_carga) = YEAR(CURDATE());
        `;
        const queryCategoriasFondos = 'SELECT * FROM categorias_fondos';

        // Ejecutar la primera consulta
        connection.query(queryFondosDisponibles, (errorFondos, resultadosFondos) => {
            if (errorFondos) {
                console.error('Ha ocurrido un error al cargar los fondos disponibles: ', errorFondos);
                return handleHttpResponse(res, 500, 'Error interno al cargar los fondos disponibles');
            } else {
                // Ejecutar la segunda consulta
                connection.query(queryCategoriasFondos, (errorCategorias, resultadosCategorias) => {
                    if (errorCategorias) {
                        console.error('Ha ocurrido un error al cargar las categorías de fondos: ', errorCategorias);
                        return handleHttpResponse(res, 500, 'Error interno al cargar las categorías de fondos');
                    } else {
                        // Renderizar la vista con los resultados de ambas consultas
                        res.render('fondos-disponibles', {
                            login: true,
                            nombre: req.session.nombre,
                            id_usuario: req.session.id_usuario,
                            secretaria: req.session.secretaria,
                            nombreSecretaria: req.session.nombreSecretaria,
                            resultadosFondos: resultadosFondos,
                            resultadosCategorias: resultadosCategorias
                        });
                    }
                });
            }
        });
    } else {
        res.render('login');
    }
};

exports.cargarFondo = (req, res) => {
    if (req.session.loggedin) {
        const { idCategoriaFondo, montoPeso, montoDolar, destinoSelect } = req.body;
        // const destino = req.body.destino; // Agregar la obtención del destino desde req.body
        //console.log(destinoSelect);
        let query;
        let values;

        if (destinoSelect === 'universidad') {
            query = 'INSERT INTO `fondos_disponibles` (`id_categoria_fondo`, `monto_peso`) VALUES (?, ?)';
            values = [idCategoriaFondo, montoPeso];
        } else if (destinoSelect === 'fundacion') {
            query = 'INSERT INTO `fondos_disponibles` (`id_categoria_fondo`, `monto_peso`, `monto_dolar`) VALUES (?, ?, ?)';
            values = [idCategoriaFondo, montoPeso, montoDolar];
        } else {
            return res.status(400).send('Destino inválido');
        }

        connection.query(query, values, (error, results) => {
            if (error) {
                console.error('Ha ocurrido un error al cargar los fondos disponibles: ', error);
                return handleHttpResponse(res, 500, 'Error interno al ingresar un nuevo fondo. Por favor comuníquese con el soporte');
            } else {
                res.redirect('fondos-disponibles');
            }
        });
    } else {
        res.render('login');
    }
};
exports.editarFondo = (req, res) => {
    if (req.session.loggedin) {
        const { editarDestino, editarMontoFondo, editarIdFondo, moneda } = req.body;
        let query = '';
        let values = [];
        if (editarDestino === 'universidad') {
            query = 'UPDATE `fondos_disponibles` SET `monto_peso` = ? WHERE `id_fondo` = ?';
            values = [editarMontoFondo, editarIdFondo];
        } else if (editarDestino === 'fundacion') {
            if(moneda === 'PESO'){
                query = 'UPDATE `fondos_disponibles` SET `monto_peso` = ? WHERE `id_fondo` = ?';
                values = [editarMontoFondo, editarIdFondo];
            } else if(moneda === 'DOLAR'){
                query = 'UPDATE `fondos_disponibles` SET `monto_dolar` = ? WHERE `id_fondo` = ?';
                values = [editarMontoFondo, editarIdFondo];
            }
        }
        connection.query(query, values, (error, results) => {
            if (error) {
                console.error('Ha ocurrido un error al actualizar el fondo disponible: ', error);
                return handleHttpResponse(res, 500, 'Error interno al actualizar el fondo. Por favor comuníquese con el soporte');
            } else {
                if (results.affectedRows === 0) {
                    console.warn('No se encontró ninguna fila para actualizar con id_fondo:', idFondo);
                    return handleHttpResponse(res, 404, 'No se encontró ninguna fila para actualizar.');
                }
                res.redirect('fondos-disponibles');
            }
        });
    } else {
        res.render('login');
    }
};
exports.borrarFondo = (req, res) => {
    if (req.session.loggedin) {
        const { borrarIdCategoriaFondo } = req.body;

        connection.query(
            'DELETE FROM `fondos_disponibles` WHERE `id_fondo` = ?',
            [borrarIdCategoriaFondo],
            (error, results) => {
                if (error) {
                    console.error('Ha ocurrido un error al borrar el fondo disponible: ', error);
                    return handleHttpResponse(res, 500, 'Error interno al borrar el fondo. Por favor comuníquese con el soporte');
                } else {
                    if (results.affectedRows === 0) {
                        console.warn('No se encontró ninguna fila para borrar con id_categoria_fondo:', borrarIdCategoriaFondo);
                        return handleHttpResponse(res, 404, 'No se encontró ninguna fila para borrar.');
                    }
                    res.redirect('fondos-disponibles');
                }
            }
        );
    } else {
        res.render('login');
    }
};
exports.registroFondos = (req, res) => {
    if (req.session.loggedin) {
        // const queryRegistroFondos = `
        // SELECT 
        //     cf.nombre_categoria_fondo, 
        //     SUM(fd.monto_peso) AS total_monto_peso, 
        //     SUM(fd.monto_dolar) AS total_monto_dolar, 
        //     WEEK(fd.fecha_carga, 1) AS semana, 
        //     YEAR(fd.fecha_carga) AS año
        // FROM 
        //     fondos_disponibles fd
        // JOIN 
        //     categorias_fondos cf ON fd.id_categoria_fondo = cf.id_categoria_fondo
        // GROUP BY 
        //     cf.nombre_categoria_fondo, semana, año
        // ORDER BY 
        //     año DESC, semana DESC;
        // `;
        const queryRegistroFondos = `SELECT * FROM vista_registro_fondos_disponibles;`
        
        // Ejecutar la primera consulta
        connection.query(queryRegistroFondos, (errorFondos, resultadosRegistrosFondos) => {
            if (errorFondos) {
                console.error('Ha ocurrido un error al cargar los fondos disponibles: ', errorFondos);
                return handleHttpResponse(res, 500, 'Error interno al cargar los fondos disponibles');
            } else {
                // Renderizar la vista con los resultados de ambas consultas
                res.render('fondos-registros', {
                    login: true,
                    nombre: req.session.nombre,
                    id_usuario: req.session.id_usuario,
                    secretaria: req.session.secretaria,
                    nombreSecretaria: req.session.nombreSecretaria,
                    resultados: resultadosRegistrosFondos
                });
            }
        });
    } else {
        res.render('login');
    }
};
