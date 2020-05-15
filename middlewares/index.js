const jwt = require('jsonwebtoken');
const sequelize = require('./../db');
const { updateQuery, replacementsQuery } = require('./../extras');

const claveSegura = 'delahila';

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
        if(req.usuario.is_admin){
        const [ordersIds] = await sequelize.query(`SELECT order_id FROM orders`, { raw: true });
        const detailedOrders = async () => {
          return Promise.all(
            ordersIds.map(async (order) => printOrderInfo(order.order_id))
          );
        };
        req.ordersList = await detailedOrders();
        next();
        } else {
            res.status(409).json('No estas autorizado')
        }
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

module.exports = {
    productValidator,
    userPassValidator,
    userAuthenticaton,
    newUserVerify,
    deleteOrder,
    UpdateStatus,
    addOrder,
    listOrders,
    listOrdersById
};