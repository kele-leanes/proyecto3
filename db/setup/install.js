const sequelize = require('../index');
const { dbName } = require('../config');

async function createDB() {
    try {
        await sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${dbName}`, { raw: true })
        .then(async () => await console.log('Base de datos creada'))
    } catch(err){
        new Error(err);
    }
}

async function createOrderTable() {
    try {
        await sequelize.query(`CREATE TABLE IF NOT EXISTS orders (
            order_id int(4) NOT NULL AUTO_INCREMENT,
            order_status varchar(60) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'New',
            order_amount int(4) NOT NULL,
            payment_method varchar(60) COLLATE utf8_unicode_ci NOT NULL,
            user_id int(4) NOT NULL,
            PRIMARY KEY (order_id),
            KEY user_id (user_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;`, { raw: true })
          .then(async () => await console.log('Tabla de ordenes creada'))
    } catch(err) {
        new Error(err);
    }
};

async function createProductTable() {
    try {
        await sequelize.query(`CREATE TABLE IF NOT EXISTS products (
            product_id int(4) NOT NULL AUTO_INCREMENT,
            product_name varchar(60) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
            price int(4) NOT NULL,
            image_url varchar(60) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
            is_favorite tinyint(1) NOT NULL,
            PRIMARY KEY (product_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;`, { raw: true })
          .then(async () => await console.log('Tabla de productos creada'))
    } catch(err) {
        new Error(err);
    }
};

async function createProductOrderTable() {
    try {
        await sequelize.query(`CREATE TABLE IF NOT EXISTS product_order (
            product_order_id int(4) NOT NULL AUTO_INCREMENT,
            order_id int(4) NOT NULL,
            product_id int(4) NOT NULL,
            product_qty int(4) NOT NULL,
            PRIMARY KEY (product_order_id),
            KEY product_id (product_id),
            KEY product_order_ibfk_1 (order_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;`, { raw: true })
          .then(async () => await console.log('Tabla productos-ordenes creada'))  
    } catch(err){
        new Error(err);
    }
}

async function createUserTable() {
    try {
        await sequelize.query(`CREATE TABLE IF NOT EXISTS users (
            user_id int(4) NOT NULL AUTO_INCREMENT,
            username varchar(255) COLLATE utf8_unicode_ci NOT NULL,
            password varchar(255) COLLATE utf8_unicode_ci NOT NULL,
            first_name varchar(255) COLLATE utf8_unicode_ci NOT NULL,
            last_name varchar(255) COLLATE utf8_unicode_ci NOT NULL,
            mail varchar(255) COLLATE utf8_unicode_ci NOT NULL,
            phone_number int(10) NOT NULL,
            address varchar(255) COLLATE utf8_unicode_ci NOT NULL,
            is_admin tinyint(1) NOT NULL DEFAULT '0',
            PRIMARY KEY (user_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;`, { raw: true })
          .then(async () => await console.log('Tabla de usuarios creada'))
    } catch(err){
        new Error(err);
    }
}

async function joinerOrder() {
    try {
        await sequelize.query(`ALTER TABLE orders
        ADD CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE;`
        ,{ raw: true })
        .then(async () => await console.log('Tabla joiner creada'))
    } catch(err) {
        new Error(err);
    }
}

async function joinerProductOrder() {
    try {
        await sequelize.query(`ALTER TABLE product_order
        ADD CONSTRAINT product_order_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT product_order_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (product_id);
      COMMIT;`, { raw: true })
      .then(async () => await console.log('Tabla joiner creada'));
    } catch(err){
        new Error(err);
    }
}


createDB();
createOrderTable();
createProductTable();
createProductOrderTable();
createUserTable();
joinerOrder();
joinerProductOrder();