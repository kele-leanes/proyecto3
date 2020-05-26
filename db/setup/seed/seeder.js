const csv = require('csv-parser')
const fs = require('fs')
const sequelize = require('../../index')
const { insertQuery, replacementsQuery } = require('../../../extras/index')
const results = [];

fs.createReadStream('users.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    results.forEach(async (results) => await sequelize.query(`${insertQuery('INSERT', 'users', results)}`,
    replacementsQuery(results)));
  });

fs.createReadStream('products.csv')
.pipe(csv())
.on('data', (data) => results.push(data))
.on('end', () => {
results.forEach(async (results) => await sequelize.query(`${insertQuery('INSERT', 'products', results)}`,
replacementsQuery(results)));
});  