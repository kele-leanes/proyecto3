const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const sequelize = require('./db/index')
const server = express();

const claveSegura = 'delahila'

server.listen(3000, () => console.log('Servidor iniciado...'));

server.use(bodyParser.json(), cors());

// MIDDLEWARES

function productValidator(req, res, next){
    if(req.body.product_name && req.body.price && req.body.image_url) {
            next();
        } else {
        return res.status(400).json('Faltan parametros');
    }  
};

async function userPassValidator(req, res, next) {
    const { username, password } = req.body;
    const query = `SELECT id, username, is_admin FROM users WHERE username = '${username}' AND password = '${password}'`
    const dbUser = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
    const foundUser = dbUser[0];
    try {
        const { username, is_admin } = foundUser; 
        const token = jwt.sign({username, is_admin}, claveSegura, {expiresIn: "15m"});
        res.json(token)
        next();
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

function newUserVerify(user) {
    const validUser = sequelize.query(`SELECT * FROM users WHERE username = '${user}'`,
    { type: sequelize.QueryTypes.SELECT });
    if(validUser == []) {
        return true;
    }
    return false   
};
    

// USERS PATHS

server.post('/registrarse', (req, res) => {
    const { username, password, first_name, last_name, mail, phone_number, address } = req.body;
    const validated = newUserVerify(username);
    if (validated) {
        sequelize.query(`INSERT INTO users (username, password, first_name, last_name, mail, phone_number, address, is_admin) 
        VALUES ('${username}','${password}','${first_name}','${last_name}','${mail}',${phone_number},'${address}', false)`)
        res.json('El usuario se registró con éxito');
    }else {
        res.json({error: `El usuario: ${req.body.username} ya existe`})
    }    
});

server.post('/login', userPassValidator, (req, res) => {
});

server.get('/usuarios', userAuthenticaton, (req, res) => {
    if(req.usuario.is_admin) {
        sequelize.query('SELECT * FROM users',
        { type: sequelize.QueryTypes.SELECT }
    )   .then(users => res.status(200).json(users));
    } else {
        res.status(409).json('No estas autorizado')
    }    
})

server.get('/usuarios/:idusuario', userAuthenticaton, (req, res) => {
    if(req.usuario.is_admin) {
        const idusuario = req.params.idusuario;
        sequelize.query(`SELECT * FROM users WHERE id = ${idusuario}`,
        { type: sequelize.QueryTypes.SELECT }
        ).then(user => res.status(200).json(user));;
    } else {
        res.status(409).json('No estas autorizado')
    }      
});

server.delete('/usuarios/:idusuario', userAuthenticaton, (req, res) => {
    if(req.usuario.is_admin){  
        const idusuario = req.params.idusuario;
        const query = `DELETE FROM users WHERE id = ${idusuario}`;
        sequelize.query(query)
        .then(() => res.status(200).json(`El usuario se eliminó con éxito`))
    } else {
        res.status(409).json('No estas autorizado')
    }      
})

server.put('/usuarios/:idusuario',userAuthenticaton, (req, res) => {
    if(req.usuario.is_admin){    
        const idusuario = req.params.idusuario;
        sequelize.query(`${updateQuery('UPDATE','users',req.body,idusuario)}`, 
        replacementsQuery(req.body))
        .then(() => res.status(200).json('El usuario se actualizó con éxito')); 
    } else {
        res.status(409).json('No estas autorizado')
    }    
});
// PRODUCTS PATHS

server.get('/productos', (req, res) => {
    sequelize.query('SELECT * FROM products',
    { type: sequelize.QueryTypes.SELECT }
    ).then(products => res.status(200).json(products));
});    

server.get('/productos/favoritos', (req, res) => {
    sequelize.query(`SELECT * FROM products WHERE is_favorite = TRUE`,
    { type: sequelize.QueryTypes.SELECT }
    ).then(products => res.status(200).json(products));
});

server.get('/productos/:idproducto', (req, res) => {
    const idproducto = req.params.idproducto;
    sequelize.query(`SELECT * FROM products WHERE id = ${idproducto}`,
    { type: sequelize.QueryTypes.SELECT }
    ).then(product => res.status(200).json(product));;
});

server.post('/productos', [productValidator, userAuthenticaton], (req, res) => {
    if(req.usuario.is_admin) {
        const { product_name, price, image_url, is_favorite } = req.body
        const query = `INSERT INTO products VALUES (NULL,'${product_name}',${price},'${image_url}',${is_favorite})`
        sequelize.query(query)
        .then(product => res.status(200).json(`El producto ${product} se agregó con éxito`))
    } else {
        res.status(409).send('No tienes permiso');
    }    
});

server.delete('/productos/:idproducto', userAuthenticaton, (req, res) => {
    if(req.usuario.is_admin){  
        const idproducto = req.params.idproducto;
        const query = `DELETE FROM products WHERE id = ${idproducto}`;
        sequelize.query(query)
        .then(product => res.status(200).json(`El producto ${product} se eliminó con éxito`))
    } else {
        res.status(409).json('No estas autorizado')
    }      
})

server.put('/productos/:idproducto',userAuthenticaton, (req, res) => {
    if(req.usuario.is_admin){    
        const idproducto = req.params.idproducto;
        sequelize.query(`${updateQuery('UPDATE','products',req.body,idproducto)}`, 
        replacementsQuery(req.body))
        .then(() => res.status(200).json('El producto se actualizó con éxito')); 
    } else {
        res.status(409).json('No estas autorizado')
    }    
});

// QUERYS CREATORS    
function updateQuery(method, table , body, id){
    const query = `${method} ${table} SET ${Object.keys(body).map(body => body + ' = ?').toString()} WHERE id = ${id}`
    return query
}

function replacementsQuery(body) {
    const replace = {
        replacements: Object.values(body)
    }
    return replace
}
