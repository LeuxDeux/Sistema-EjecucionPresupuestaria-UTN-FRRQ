const connection = require('../database/db');

//ROOT
exports.root = (req, res) =>{
    if(req.session.loggedin){ // Si está logeado
        res.render('index', {
            login: true,
            nombre: req.session.nombre, // Nombre Usuario
            secretaria: req.session.secretaria, // ID Secretaria
            id_usuario: req.session.id_usuario // ID Usuario
        });
        console.log('APP.GET "/" Sesión Correcta - Usuario: ' + req.session.nombre + ' Secretaria ID: ' + req.session.secretaria);
        console.log('Redireccionando hacia index.ejs')
    }else{
        res.render('index', {
            login: false,
            nombre: 'Debe iniciar sesión',
            secretaria: '',
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
