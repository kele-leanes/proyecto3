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
    const query = `SELECT user_id, username, is_admin FROM users WHERE username = '${username}' AND password = '${password}'`
    const dbUser = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
    const foundUser = dbUser[0];
    try {
        const { username, is_admin, user_id } = foundUser; 
        const token = jwt.sign({ username, is_admin, user_id }, claveSegura, {expiresIn: "15m"});
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

async function findProductById(id) {
    const [dbProduct] = await sequelize.query(`SELECT * FROM products WHERE product_id = ${id}`, { raw: true });
    const foundProduct = await dbProduct.find(
      (element) => element.product_id === id
    );
    return foundProduct;
}

async function deleteOrder(req, res, next) {
    const id = req.params.idorder;
    try {
        if(req.usuario.is_admin) {
            await sequelize.query(`DELETE FROM orders WHERE order_id = ${id}`, { raw: true });
            return next();
        } else {
            res.status(409).json('No estas autorizado')
        }
    } catch (err) {
        return res.status(404).json(`Algo salió mal. Error: ${err}`);
    }
}

async function UpdateStatus(req, res, next) {
    const id = req.params.idorder;
    try {
        if(req.usuario.is_admin){
            await sequelize.query(`${updateQuery('UPDATE', 'orders', req.body, 'order_id', id)}`,
            replacementsQuery(req.body));
            next();
        } else {
            res.status(409).json('No estas autorizado')
        }
    } catch (err) {
        return res.status(404).json(`Algo salió mal. Error: ${err}`);
    }
}

async function addOrder(req, res, next) {
    try {
        req.createdOrder = await addOrderInDb(req, res);
        next();
      } catch (err) {
        next(new Error(err));
      }
}

async function addOrderInDb(req, res) {
    const { products, payment_method } = req.body;
    if (products && payment_method) {
      if (req.usuario.user_id) {
        const userId = req.usuario.user_id;
        const totalPrice = await obtainOrderPrice(products);
        const addedOrder = await createOrderRegistry(
          totalPrice,
          payment_method,
          userId
        );
        await createOrderRelationship(addedOrder, products);
        return await printOrderInfo(addedOrder);
      } else {
        res.status(400).json("Usuario no encontrado");
      }
    } else {
      res.status(405).json("Faltan parametros");
    }
}

async function createOrderRegistry( totalPrice, paymentMethod, user) { 
    const [addedRegistry] = await sequelize.query(`INSERT INTO orders ( order_amount, payment_method, user_id ) 
    VALUES (${totalPrice}, '${paymentMethod}', ${user} )`, { raw: true });
    return addedRegistry;
  }

async function obtainOrderPrice(products) {
    let subtotal = 0;
    for (let i = 0; i < products.length; i++) {
      subtotal = +subtotal + +(await findProductPrice(products[i]));
    }
    return subtotal;
  }

async function findProductPrice(product) {
    const { productId, quantity } = product;
    const productPrice = (await findProductById(productId)).price;
    const subtotal = `${+productPrice * +quantity}`;
    return subtotal;
}  

async function createOrderRelationship(orderId, products) {
    products.forEach(async (product) => {
        const { productId, quantity } = product;
        await sequelize.query(`INSERT INTO product_order (order_id, product_id, product_qty ) 
        VALUES (${orderId}, ${productId}, ${quantity})`, { raw: true });
    });
    return true;
}

async function listOrders(req, res , next) {
    try {
        const [ordersIds] = await sequelize.query(`SELECT order_id FROM orders`, { raw: true });
        const detailedOrders = async () => {
          return Promise.all(
            ordersIds.map(async (order) => printOrderInfo(order.order_id))
          );
        };
        req.ordersList = await detailedOrders();
        next();
      } catch (err) {
        next(new Error(err));
    }
}

async function listOrdersById(req, res, next) {
    try {
        if(req.usuario.is_admin){
            const [ordersIds] = await sequelize.query(
                `SELECT order_id FROM orders WHERE order_id = ${req.params.idorder}`, 
            { raw: true });
            const detailedOrders = async () => {
            return Promise.all(
                ordersIds.map(async (order) => printOrderInfo(order.order_id)));};
            req.ordersList = await detailedOrders();
            next();
            } else {
                res.status(409).json('No estas autorizado')
            }
        } catch (err) {
        next(new Error(err));
    }
}

async function printOrderInfo(orderId) {
    const [orderInfo] = await sequelize.query(`SELECT *, users.username, users.first_name, users.last_name, users.address, users.mail, users.phone_number, users.user_id 
        FROM orders JOIN users ON orders.user_id = users.user_id WHERE order_id = ${orderId}`,{ raw: true });
    return completeDesc(orderInfo);
}  

async function completeDesc(orderInfo) {
    const order = orderInfo[0];
    const [productsInfo] = await sequelize.query(`SELECT product_order.product_qty, product_order.product_id, products.* FROM product_order 
        JOIN products ON product_order.product_id = products.product_id WHERE order_id = ${order.order_id}`, { raw: true });
    order.products = await productsInfo;
    return order;
}

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

server.get('/orders', listOrders, (req, res) => {
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

// QUERYS CREATORS    
function updateQuery(method, table , body, table_id, id){
    const query = `${method} ${table} SET 
    ${Object.keys(body).map(body => body + ' = ?').toString()} 
    WHERE ${table_id} = ${id}`
    return query
}

function replacementsQuery(body) {
    const replace = {
        replacements: Object.values(body)
    }
    return replace
}

function insertQuery(method, table, body){
    const query = `${method} INTO ${table} (
        ${Object.keys(body).map(body => body).toString()}) VALUES (
            ${Object.keys(body).map(() => '?').toString()})`
    return query
}