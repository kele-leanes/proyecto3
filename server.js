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
            req.body.isFavorite === 'true' ? req.body.isFavorite = true : req.body.isFavorite = false;
            next();
        } else {
        return res.status(400).json('Faltan parametros');
    }  
};

function userPassValidator(mail, contrasena) {
    const [filterUser] = usuarios.filter(element => element.mail === mail && element.contrasena === contrasena);
    if (!filterUser) {
        return false;
    }
    return filterUser;
};

function userAuthenticaton(req, res, next) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verifyToken = jwt.verify(token, claveSegura);
        if (verifyToken) {
            req.usuario = verifyToken;
            return next();
        }
    } catch (err) {
        res.json({ error: 'Error al validar el usuario'});
    }
};

function newUserVerify(mail) {
    const [userInvalid] = (usuarios.filter(element => element.mail === mail));
    if(!userInvalid) {
        return false;
    }
    return userInvalid   
};
    

// USERS PATHS

server.post('/register', (req, res) => {
    const validated = newUserVerify(req.body.mail);
    if (!validated) {
        usuarios.push(req.body);
        res.json('El usuario se registró con éxito');
    }else {
        res.json({error: `El usuario: ${req.body.mail} ya existe`})
    }    
});

server.post('/login', (req, res) => {
    const { mail, contrasena } = req.body;
    const validated = userPassValidator(mail, contrasena);
    if (!validated) {
        res.json({error: 'No existe el usuario o la contraseña es incorrecta'});
        return
    }

    const token = jwt.sign({ mail }, claveSegura, {expiresIn: "15m"});

    res.json({ token })

});

server.get('/auth', userAuthenticaton,  (req, res) => {
    res.send(`Esta es una página autenticada. Hola ${req.usuario.mail} !`);
})
// PRODUCTS PATHS

server.get('/productos', (req, res) => {
    sequelize.query('SELECT * FROM products',
    { type: sequelize.QueryTypes.SELECT }
    ).then(function(productos){
        res.json(productos);
    });
});    

server.get('/productos/favoritos', (req, res) => {
    sequelize.query(`SELECT * FROM products WHERE is_favorite = TRUE`,
    { type: sequelize.QueryTypes.SELECT }
    ).then(function(productos){
        res.json(productos);
    });;
});

server.get('/productos/:idproducto', (req, res) => {
    const idproducto = req.params.idproducto;
    sequelize.query(`SELECT * FROM products WHERE id = ${idproducto}`,
    { type: sequelize.QueryTypes.SELECT }
    ).then(function(producto){
        res.json(producto);
    });;
});

server.post('/productos', productValidator, (req, res) => {
    const { product_name, price, image_url, is_favorite } = req.body
    const query = `INSERT INTO products VALUES (NULL,'${product_name}',${price},'${image_url}',${is_favorite})`
    sequelize.query(query, { type: sequelize.QueryTypes.INSERT }
    ).then(function(producto){
        res.send('El producto se agregó con éxito');
    });
});

