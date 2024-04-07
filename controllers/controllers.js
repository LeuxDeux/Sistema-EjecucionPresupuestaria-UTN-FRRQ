const connection = require('../database/db');

exports.crearCategorias = (req, res)=>{
    const user = req.body.user; //definido en form
    const rol = req.body.rol;
    connection.query('INSERT INTO users SET ?', {user:user, rol:rol}, (error, results)=>{
        if(error){
            throw error;
        }else{
            res.redirect('/');
        }
    });
}