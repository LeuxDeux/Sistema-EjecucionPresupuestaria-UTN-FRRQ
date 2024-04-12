const connection = require('../database/db');
const fs = require('fs'); // Importar FileSystem para operaciones de archivos

exports.crearCategorias = (req, res) => {
    const nombre = req.body.nombre;
    const secretaria_id = req.body.secretaria_id;

    const categoria = { nombre: nombre, secretaria_id: secretaria_id };

    connection.query('INSERT INTO categorias SET ?', categoria, (error, results) => {
        if (error) {
            throw error;
        } else {
            console.log('Categoría creada con éxito');
            
            // Después de agregar la categoría, consulta nuevamente las categorías de la base de datos
            connection.query('SELECT * FROM categorias WHERE secretaria_id = ?', [secretaria_id], (error, categorias) => {
                if (error) {
                    throw error;
                } else {
                    // Renderizar la vista categorias.ejs nuevamente con las nuevas categorías
                    res.render('categorias', {
                        login: true,
                        nombre: req.session.nombre,
                        secretaria: req.session.secretaria,
                        categorias: categorias,
                        id_usuario: req.session.id_usuario
                    });
                }
            });
        }
    });
};
exports.editarCategoria = (req, res) => {
    const categoriaId = req.body.id; // Obtenemos el ID de la categoría desde el cuerpo de la solicitud
    const nuevoNombre = req.body.nuevoNombre; // Obtenemos el nuevo nombre de la categoría desde el cuerpo de la solicitud
    // Realizamos la actualización en la base de datos
    connection.query('UPDATE categorias SET nombre = ? WHERE id = ?', [nuevoNombre, categoriaId], (error, results) => {
        if (error) {
            throw error;
        } else {
            console.log('Categoría actualizada con éxito');
            // Después de actualizar la categoría, consultamos nuevamente las categorías de la base de datos
            connection.query('SELECT * FROM categorias WHERE secretaria_id = ?', [req.session.secretaria], (error, categorias) => {
                if (error) {
                    throw error;
                } else {
                    // Renderizamos la vista 'categorias.ejs' nuevamente con las categorías actualizadas
                    res.render('categorias', {
                        login: true,
                        nombre: req.session.nombre,
                        secretaria: req.session.secretaria,
                        categorias: categorias,
                        id_usuario: req.session.id_usuario
                    });
                }
            });
        }
    });
};

exports.descargarArchivo = (req, res) => {
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
                res.setHeader('Content-Disposition', `attachment; filename="${nombreFactura}.pdf"`);
                // enviar el contenido del archivo como respuesta
                fs.createReadStream(rutaArchivo).pipe(res);
            } else { // Si no se encontró el archivo con el ID proporcionado
                res.status(404).send({ error: 'Archivo no encontrado' }); // Enviar un error
            }
        }
    });
};