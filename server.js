const express = require('express');
const server = express();

let productos = [
    {
        ID : 1,
        Nombre : 'Hamburguesa',
        Precio : 350,
        Url : ''
    },
    {
        ID : 2,
        Nombre : 'Lomito',
        Precio : 400,
        Url : ''
    },
    {
        ID : 3,
        Nombre : 'Papas Fritas',
        Precio : 200,
        Url : ''
    }
]

server.listen(3000, () => console.log('Servidor iniciado...'));

server.get('/productos', (req, res) => {
    res.json(productos);
});

server.get('/productos/:idproducto', (req, res) => {
    const idproducto = req.params.idproducto;
    res.json(productos[idproducto]);
});
