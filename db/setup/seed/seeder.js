const csv = require('csv-parser')
const fs = require('fs')
const sequelize = require('../../index')
const { insertQuery, replacementsQuery } = require('../../../extras/index')
const arrUsers = [];
const arrProducts = [];

fs.createReadStream('./db/setup/seed/users.csv')
  .pipe(csv())
  .on('data', (data) => arrUsers.push(data))
  .on('end', () => {
    arrUsers.forEach(async (user) => await sequelize.query(`${insertQuery('INSERT', 'users', user)}`,
    replacementsQuery(user)));
  });

fs.createReadStream('./db/setup/seed/products.csv')
.pipe(csv())
.on('data', (data) => arrProducts.push(data))
.on('end', () => {
arrProducts.forEach(async (product) => await sequelize.query(`${insertQuery('INSERT', 'products', product)}`,
replacementsQuery(product)));
});  