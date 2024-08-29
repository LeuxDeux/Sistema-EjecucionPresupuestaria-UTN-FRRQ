const connection = require('../database/db');

const queryPromise = (query) => {
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

//ROOT
exports.root = (req, res) => {
    if (req.session.loggedin) {
        const query1 = `
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
            ORDER BY fecha;
        `;

        const query2 = `
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

        Promise.all([queryPromise(query1), queryPromise(query2)])
            .then((results) => {
                const [resultados1, resultados2] = results;
                res.render('index', {
                    login: true,
                    nombre: req.session.nombre,
                    id_usuario: req.session.id_usuario,
                    secretaria: req.session.secretaria,
                    nombreSecretaria: req.session.nombreSecretaria,
                    resultados: resultados1,
                    resultadosFondos: resultados2
                });
                console.log(resultados1, resultados2);
            })
            .catch((error) => {
                console.error("Error en la consulta SQL:", error);
                res.status(500).send("Error en la consulta SQL");
            });
    } else {
        res.render('index', {
            login: false,
            nombre: 'Debe iniciar sesión',
            secretaria: '',
            id_usuario: '',
            nombreSecretaria: '',
            resultados: [],
            resultadosFondos: []
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

