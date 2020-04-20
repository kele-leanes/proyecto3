/*Username: Sf4Xe2cR6N

Database name: Sf4Xe2cR6N

Password: PdOw1gkbVO

Server: remotemysql.com

Port: 3306*/

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const server = express();

let productos = [
    {
        id : 1,
        nombre : 'Hamburguesa',
        precio : 350,
        url : '',
        isFavorite : true
    },
    {
        id : 2,
        nombre : 'Lomito',
        precio : 400,
        url : '',
        isFavorite : false
    },
    {
        id : 3,
        nombre : 'Papas Fritas',
        precio : 200,
        url : '',
        isFavorite : true
    }
]

const claveSegura = 'delahila'

let usuarios = [
    {
        usuario : 'Ezequiel',
        contrasena : 'Password'
    },
    {
        usuario : 'Martin',
        contrasena : '12345678'
    }

]

server.listen(3000, () => console.log('Servidor iniciado...'));


server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(cors());

// Cors

function allowCors(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
};

//Middlewares

function productValidator(req, res, next){
    if(req.body.id && req.body.nombre && req.body.precio && req.body.url){
        let match = false;
        productos.forEach(e => {
            if(e.id == req.body.id){
                match = true
            }
        });      
        if(match) {
            res.status(409).json('El id ya existe');
        } else {
            req.body.id = parseInt(req.body.id);
            req.body.precio = parseInt(req.body.precio);
            req.body.isFavorite === 'true' ? req.body.isFavorite = true : req.body.isFavorite = false;
            next();
        }       
    } else {
        res.status(400).json('Faltan parametros');
    }  
};

function userPassValidator(usuario, contrasena) {
    const [filterUser] = usuarios.filter(element => element.usuario === usuario && element.contrasena === contrasena);
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
}

//Paths

server.post('/login', allowCors, (req, res) => {
    const { usuario, contrasena } = req.body;
    const validated = userPassValidator(usuario, contrasena);
    if (!validated) {
        res.json({error: 'No existe el usuario o la contraseña es incorrecta'});
        return
    }

    const token = jwt.sign({usuario}, claveSegura);

    res.json({ token })

});

server.get('/auth', [userAuthenticaton, allowCors], (req, res) => {
    res.send(`Esta es una página autenticada. Hola ${req.usuario.usuario} !`);
})

server.get('/productos', allowCors, (req, res) => {
    res.json(productos);
});

server.get('/productos/:idproducto', allowCors, (req, res) => {
    const idproducto = req.params.idproducto;
    if(idproducto > productos.length || idproducto == 0) {
        return res.status(404).send('Artículo no encontrado');
    }
    res.json(productos[idproducto-1]);
});

server.post('/productos', [productValidator, allowCors], (req, res) => {
    productos.push(req.body);
    console.log('El producto ha sido agregado con exito');
    console.log(productos);
    res.json(req.body);
});

server.get('/productos-favoritos', allowCors, (req, res) => {
    const favorites = productos.filter(elem => elem.isFavorite == true);
    console.log(favorites);
    res.json(favorites);
    
});

/* server.post('/register' (req, res) => {

}) */
