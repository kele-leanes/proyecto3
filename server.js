const express = require('express');
const bodyParser = require('body-parser');
const server = express();

let productos = [
    {
        id : 1,
        nombre : 'Hamburguesa',
        precio : 350,
        url : ''
    },
    {
        id : 2,
        nombre : 'Lomito',
        precio : 400,
        url : ''
    },
    {
        id : 3,
        nombre : 'Papas Fritas',
        precio : 200,
        url : ''
    }
]

server.listen(3000, () => console.log('Servidor iniciado...'));

server.use(bodyParser.json());

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
            next();
        }       
    } else {
        res.status(400).json('Faltan parametros');
    }  
};

server.get('/productos', (req, res) => {
    res.json(productos);
});

server.get('/productos/:idproducto', (req, res) => {
    const idproducto = req.params.idproducto;
    if(idproducto > productos.length || idproducto == 0) {
        return res.status(404).send('Artículo no encontrado');
    }
    res.json(productos[idproducto-1]);
});

server.post('/nuevo-producto', productValidator, (req, res) => {
    productos.push(req.body);
    console.log('El producto ha sido agregado con exito');
    res.json(req.body);
})
