const dbHost = "remotemysql.com";     //MODIFICAR HOST PARA LOCAL O REMOTO
const dbName = "DxfGJQpIAx";          //NOMBRE DE LA BASE DE DATOS CRREADA
const dbPort = "3306";
const dbUser = "DxfGJQpIAx";
const password = "KCe31dFt4o";

const dbPath = `mysql://${dbUser}:${password}@${dbHost}:${dbPort}/${dbName}`;

module.exports = { dbName, dbPath }