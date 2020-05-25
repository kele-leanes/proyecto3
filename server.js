const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const server = express();
const { 
    deleteOrder,
    UpdateStatus,
    addOrder,
    listOrders,
    listOrdersById
    } = require('./middlewares/orders/orders');

const { userPassValidator,
    userAuthenticaton,
    newUserVerify,
    addUser,
    userValidator,
    getUsers,
    getUserById,
    deleteUser,
    updateUser
    } = require('./middlewares/users/users');

const {
    productValidator,
    getProducts,
    getFavorites,
    getProductById,
    addProduct,
    deleteProduct,
    UpdateProduct
    } = require('./middlewares/products/products')


server.listen(process.env.PORT || 3000, () => console.log('Servidor iniciado...'));

server.use(bodyParser.json(), cors());

server.get('/', (req, res) => {
    res.status(200).json("API Delilah Restó")
})


// USERS PATHS

server.post('/registrarse', [userValidator, newUserVerify, addUser], (req, res) => {
    res.status(200).json('El usuario se registró con éxito'); 
});

server.post('/login', userPassValidator, (req, res) => {
    res.status(200).json({ "token": req.token })
});

server.get('/usuarios', [userAuthenticaton, getUsers], (req, res) => {
    res.status(200).json(req.usuarios);
})

server.get('/usuarios/:idusuario', [userAuthenticaton, getUserById], (req, res) => {
    res.status(200).json(req.usuario);
});

server.delete('/usuarios/:idusuario', [userAuthenticaton, deleteUser], (req, res) => {
    res.status(200).json(`El usuario se eliminó con éxito`);  
})

server.put('/usuarios/:idusuario', [userAuthenticaton,updateUser], (req, res) => {
    res.status(200).json('El usuario se actualizó con éxito'); 
      
});

// PRODUCTS PATHS

server.get('/productos', getProducts, (req, res) => {
    res.status(200).json(req.products);
});    

server.get('/productos/favoritos', getFavorites, (req, res) => {
    res.status(200).json(req.products);
});

server.get('/productos/:idproducto', getProductById, (req, res) => {
    res.status(200).json(req.product);;
});

server.post('/productos', [productValidator, userAuthenticaton, addProduct], (req, res) => {
    res.status(200).json(`El producto se agregó con éxito`);
});

server.delete('/productos/:idproducto', [userAuthenticaton, deleteProduct], (req, res) => {
    res.status(200).json('Producto eliminado');    
})

server.put('/productos/:idproducto', [userAuthenticaton,UpdateProduct], (req, res) => {
    res.status(200).json('El producto se actualizó con éxito');
});

//ORDER PATHS

server.get('/ordenes', [userAuthenticaton,listOrders], (req, res) => {
    res.status(200).json(req.ordersList)
})

server.get('/ordenes/:idorder', [userAuthenticaton,listOrdersById], (req, res) => {
    res.status(200).json(req.ordersList)
})    

server.post('/ordenes', [userAuthenticaton,addOrder], (req, res) => {
    res.status(200).json(req.createdOrder);
})

server.delete('/ordenes/:idorder', [userAuthenticaton,deleteOrder], (req, res) => {
    res.status(200).json('Orden eliminada')
})    

server.put('/ordenes/:idorder', [userAuthenticaton,UpdateStatus], (req, res) => {
    res.status(200).json('Orden actualizada')
})    