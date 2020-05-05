const dbHost = "remotemysql.com";
const dbName = "DxfGJQpIAx";
const dbPort = "3306";
const dbUser = "DxfGJQpIAx";
const password = "KCe31dFt4o";

const dbPath = `mysql://${dbUser}:${password}@${dbHost}:${dbPort}/${dbName}`;

module.exports = dbPath;