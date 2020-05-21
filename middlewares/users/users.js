const jwt = require('jsonwebtoken');
const sequelize = require('./../../db');
const { insertQuery, updateQuery, replacementsQuery } = require('./../../extras');

const claveSegura = 'delahila';

async function userPassValidator(req, res, next) {
    const { username, password } = req.body;
    const query = `SELECT user_id, username, is_admin FROM users WHERE username = '${username}' AND password = '${password}'`
    const dbUser = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
    const foundUser = dbUser[0];
    try {
        const { username, is_admin, user_id } = foundUser; 
        req.token = jwt.sign({ username, is_admin, user_id }, claveSegura, {expiresIn: "30m"});
        return next();
    } catch {
        res.json({error: 'No existe el usuario o la contraseña es incorrecta'});
    }
};

function userAuthenticaton(req, res, next) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifyToken = jwt.verify(token, claveSegura);
        if (verifyToken.is_admin) {
            req.usuario = verifyToken;
            return next();
        } else {
            req.usuario = verifyToken;
            return next();
        }
    } catch (err) {
        res.json({ error: 'Error al validar el usuario'});
    }
};

function userValidator(req, res, next){
    const { username, password, first_name, last_name, mail, phone_number, address } = req.body;
    if(username && password && first_name && last_name && mail && phone_number && address) {
            next();
        } else {
        return res.status(400).json('Faltan parametros');
    }  
};

async function newUserVerify(req, res, next) {
    try {
        const existingUser = await sequelize.query(`SELECT * FROM users WHERE username = '${req.body.username}'`,
        { type: sequelize.QueryTypes.SELECT });
        if(!existingUser.length) {
            next();
        } else {
            res.status(409).json("El usuario ya existe");
        }
    } catch (err) {
        next(new Error(err));
      }
};

async function addUser(req, res, next) {
    try{
        await sequelize.query(`${insertQuery('INSERT','users',req.body)}`,
        replacementsQuery(req.body));
        return next()
    } catch(e) {
        next(new Error(err));
    }
}

async function getUsers(req, res, next) {
    if(req.usuario.is_admin) {
        req.usuarios = await sequelize.query('SELECT * FROM users',
        { type: sequelize.QueryTypes.SELECT })
        return next();   
    } else {
        res.status(409).json('No estas autorizado')
    }  
}

async function getUserById(req, res, next) {
    if(req.usuario.is_admin) {
        const idusuario = req.params.idusuario;
        const usuario = await sequelize.query(`SELECT * FROM users WHERE user_id = ${idusuario}`,
        { type: sequelize.QueryTypes.SELECT })
        req.usuario = usuario[0]
        next()
    } else {
        res.status(409).json('No estas autorizado')
    }      
}

async function deleteUser(req, res, next) {
    const id = req.params.idusuario;
    try {
        if(req.usuario.is_admin) {
            await sequelize.query(`DELETE FROM users WHERE user_id = ${id}`, { raw: true });
            return next();
        } else {
            res.status(409).json('No estas autorizado')
        }
    } catch (err) {
        return res.status(404).json(`Algo salió mal. Error: ${err}`);
    }
};

async function updateUser(req, res, next) {
    const id = req.params.idusuario;
    try {
        if(req.usuario.is_admin){
            await sequelize.query(`${updateQuery('UPDATE', 'users', req.body, 'user_id', id)}`,
            replacementsQuery(req.body));
            next();
        } else {
            res.status(409).json('No estas autorizado')
        }
    } catch (err) {
        return res.status(404).json(`Algo salió mal. Error: ${err}`);
    }
}

module.exports = {
    userPassValidator,
    userAuthenticaton,
    newUserVerify,
    addUser,
    userValidator,
    getUsers,
    getUserById,
    deleteUser,
    updateUser
}