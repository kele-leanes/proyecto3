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
    const query = `SELECT id, username, first_name, last_name, mail, phone_number, address, is_admin FROM users WHERE username = '${username}' AND password = '${password}'`
    const dbUser = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
    const foundUser = dbUser[0];
    try {
        const { username, is_admin } = foundUser; 
        const token = jwt.sign({username, is_admin}, claveSegura, {expiresIn: "15m"});
        res.json({token})
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

server.post('/login', userPassValidator, (req, res) => {
    res.json('Sesion iniciada');
});

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

server.post('/productos', [productValidator, userAuthenticaton], (req, res) => {
    if(req.usuario.is_admin) {
        const { product_name, price, image_url, is_favorite } = req.body
        const query = `INSERT INTO products VALUES (NULL,'${product_name}',${price},'${image_url}',${is_favorite})`
        sequelize.query(query, { type: sequelize.QueryTypes.INSERT }
        ).then(function(producto){
            res.send('El producto se agregó con éxito');
        });
    } else {
        res.status(409).send('No tienes permiso');
    }    
});

server.put('/productos/:idproducto', userAuthenticaton, (req, res) => {
    const idproducto = req.params.idproducto;
    const { product_name, price, image_url, is_favorite } = req.body
    sequelize.query(`UPDATE products SET product_name = '${product_name}', price = ${price}, image_url = '${image_url}', is_favorite = ${is_favorite} WHERE id = ${idproducto}`,
    { type: sequelize.QueryTypes.UPDATE })
    res.send('El producto se agregó con éxito');
});

server.delete('/productos/:idproducto', userAuthenticaton, (req, res) => {
    const idproducto = req.params.idproducto;
    const query = `DELETE FROM products WHERE id = ${idproducto}`;
    sequelize.query(query, { type: sequelize.QueryTypes.DELETE })
    res.send('El producto se eliminó con éxito');
})