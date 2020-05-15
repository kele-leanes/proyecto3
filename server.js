const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./db');
const server = express();
const { updateQuery, replacementsQuery, insertQuery } = require('./extras')
const { productValidator,
    userPassValidator,
    userAuthenticaton,
    newUserVerify,
    deleteOrder,
    UpdateStatus,
    addOrder,
    listOrders,
    listOrdersById
    } = require('./middlewares');



server.listen(3000, () => console.log('Servidor iniciado...'));

server.use(bodyParser.json(), cors());

// USERS PATHS

server.post('/registrarse', newUserVerify, (req, res) => {
    sequelize.query(`${insertQuery('INSERT','users',req.body)}`,
    replacementsQuery(req.body))
    res.json('El usuario se registró con éxito');    
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
        sequelize.query(`SELECT * FROM users WHERE user_id = ${idusuario}`,
        { type: sequelize.QueryTypes.SELECT }
        ).then(user => res.status(200).json(user));;
    } else {
        res.status(409).json('No estas autorizado')
    }      
});

server.delete('/usuarios/:idusuario', userAuthenticaton, (req, res) => {
    if(req.usuario.is_admin){  
        const idusuario = req.params.idusuario;
        const query = `DELETE FROM users WHERE user_id = ${idusuario}`;
        sequelize.query(query)
        .then(() => res.status(200).json(`El usuario se eliminó con éxito`))
    } else {
        res.status(409).json('No estas autorizado')
    }      
})

server.put('/usuarios/:idusuario',userAuthenticaton, (req, res) => {
    if(req.usuario.is_admin){    
        const idusuario = req.params.idusuario;
        sequelize.query(`${updateQuery('UPDATE','users',req.body,'user_id',idusuario)}`, 
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
    sequelize.query(`SELECT * FROM products WHERE product_id = ${idproducto}`,
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
        const query = `DELETE FROM products WHERE product_id = ${idproducto}`;
        sequelize.query(query)
        .then(product => res.status(200).json(`El producto ${product} se eliminó con éxito`))
    } else {
        res.status(409).json('No estas autorizado')
    }      
})

server.put('/productos/:idproducto',userAuthenticaton, (req, res) => {
    if(req.usuario.is_admin){    
        const idproducto = req.params.idproducto;
        sequelize.query(`${updateQuery('UPDATE','products',req.body,'product_id',idproducto)}`, 
        replacementsQuery(req.body))
        .then(() => res.status(200).json('El producto se actualizó con éxito')); 
    } else {
        res.status(409).json('No estas autorizado')
    }    
});

//ORDER PATHS

server.get('/orders', [userAuthenticaton,listOrders], (req, res) => {
    res.status(200).json(req.ordersList)
})

server.get('/orders/:idorder', [userAuthenticaton,listOrdersById], (req, res) => {
    res.status(200).json(req.ordersList)
})    

server.post('/orders/', [userAuthenticaton,addOrder], (req, res) => {
    res.status(200).json(req.createdOrder);
})

server.delete('/orders/:idorder', [userAuthenticaton,deleteOrder], (req, res) => {
    res.status(200).json('Orden eliminada')
})    

server.put('/orders/:idorder', [userAuthenticaton,UpdateStatus], (req, res) => {
    res.status(200).json('Orden actualizada')
})    