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
