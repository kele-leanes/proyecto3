# DELILAH RESTO - ACAMICA

API de administración de pedidos

[Deploy URL](https://delilah-resto-acamica.herokuapp.com)

## Para empezar

Clonar o descargar el repositorio:
```
git@github.com:kele-leanes/proyecto3.git
```  
### Pre-requisitos

Tener Node.js instalado y una base de datos creada en MYSQL  *- puede ser remota o local.*

### Instalación

Instalar dependencias:
```
$ npm install
````

Configurar base de datos:

*En la ruta db/config.js modificar los parametros de nuestra base ya creada.*

Creación de tablas:
```
$ npm run createdb
```

Popular base de datos:
```
$ npm run seeddb
```

### Iniciar API

```
$ npm run start
```
## Documentación

[OpenAPI](./spec.yaml)

## Dependencias

* [Body Parser](http://github.com/expressjs/body-parser) - Node.js body parsing middleware
* [Cors](https://github.com/expressjs/cors) - Used to enable CORS
* [CSV-Parser](https://github.com/mafintosh/csv-parser) - Convert CSV into JSON
* [Express](https://expressjs.com/) - Web framework for Node
* [File-System](https://github.com/douzi8/file-system) - Used to manage CSV files 
* [JWT](https://github.com/auth0/node-jsonwebtoken) - An implementation of JSON Web Tokens.
* [My SQL 2](https://github.com/sidorares/node-mysql2) - MySQL client for Node.js
* [Sequelize](https://sequelize.org/) - Sequelize is a promise-based Node.js ORM

## Autor

* **Ezequiel Leanes** - [GitHub](https://github.com/kele-leanes)
