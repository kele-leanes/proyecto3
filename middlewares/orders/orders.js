const sequelize = require('./../../db');
const { findProductById } = require('./../products/products')
const { updateQuery, replacementsQuery } = require('./../../extras');


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
        await sequelize.query(`INSERT INTO product_order (order_id, product_id, product_qty) 
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
    deleteOrder,
    UpdateStatus,
    addOrder,
    listOrders,
    listOrdersById,    
};