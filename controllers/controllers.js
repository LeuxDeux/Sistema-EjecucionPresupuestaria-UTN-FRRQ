const connection = require('../database/db');

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
                        categorias: categorias
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
                        categorias: categorias
                    });
                }
            });
        }
    });
};

