const connection = require('../database/db');

//ROOT
exports.root = (req, res) => {
    if (req.session.loggedin) {
        connection.query(`
            SELECT 
                fecha, 
                nombre, 
                tipo, 
                nombre_secretaria, 
                nombre_categoria, 
                nombre_usuario, 
                IF(tipo = "egreso", monto, 0) AS perdida, 
                IF(tipo = "ingreso", monto, 0) AS ganancia 
            FROM (
                SELECT 
                    f.fecha_carga AS fecha, 
                    f.nombre_factura AS nombre, 
                    "egreso" AS tipo, 
                    s.nombre AS nombre_secretaria, 
                    c.nombre AS nombre_categoria, 
                    u.nombres AS nombre_usuario, 
                    f.monto AS monto 
                FROM facturas f 
                JOIN categorias c ON f.categoria_id = c.id 
                JOIN secretarias s ON c.secretaria_id = s.id 
                JOIN usuarios u ON f.usuario_id = u.id 
                WHERE f.estado = "aceptado" 
                UNION ALL 
                SELECT 
                    i.fecha_ingreso AS fecha, 
                    i.nombre_ingreso AS nombre, 
                    "ingreso" AS tipo, 
                    s.nombre AS nombre_secretaria, 
                    c.nombre AS nombre_categoria, 
                    u.nombres AS nombre_usuario, 
                    i.monto AS monto 
                FROM ingresos i 
                JOIN categorias c ON i.categoria_id = c.id 
                JOIN secretarias s ON i.secretaria_id = s.id 
                JOIN usuarios u ON i.usuario_id = u.id
            ) AS combined_data 
            ORDER BY fecha
        `, (error, results) => {
            if (error) {
                console.error("Error en la consulta SQL:", error);
                res.status(500).send("Error en la consulta SQL");
            } else {
                console.log("Resultados de la consulta:", results);
                res.render('index', {
                    login: true,
                    nombre: req.session.nombre,
                    id_usuario: req.session.id_usuario,
                    secretaria: req.session.secretaria,
                    nombreSecretaria: req.session.nombreSecretaria,
                    resultados: results
                });
            }
        });
    } else {
        res.render('index', {
            login: false,
            nombre: 'Debe iniciar sesión',
            secretaria: '',
            id_usuario: '',
            nombreSecretaria: '',
            resultados: []
        });
    }
};

//LOGIN
exports.login = (req, res) => { // RUTA LOGIN
    res.render('login');
};

//REGISTRO
exports.registro = (req, res) =>{ // RUTA REGISTRO
    connection.query('SELECT * FROM secretarias', (error, results)=>{
        if(error){
            throw error;
        }else{
            res.render('registro', {results:results});
        }
    });
};

