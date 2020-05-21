const sequelize = require('./../../db');
const { insertQuery, updateQuery, replacementsQuery } = require('./../../extras');

function productValidator(req, res, next){
    if(req.body.product_name && req.body.price && req.body.image_url) {
            next();
        } else {
        return res.status(400).json('Faltan parametros');
    }  
};

async function getProducts(req, res, next) {
    req.products = await sequelize.query('SELECT * FROM products',
    { type: sequelize.QueryTypes.SELECT });
    next();
}

async function getFavorites(req, res, next){
    req.products = await sequelize.query(`SELECT * FROM products WHERE is_favorite = TRUE`,
    { type: sequelize.QueryTypes.SELECT });
    next()
}

async function findProductById(id) {
    const [dbProduct] = await sequelize.query(`SELECT * FROM products WHERE product_id = ${id}`, { raw: true });
    const foundProduct = await dbProduct.find((element) => element.product_id === id);
    return foundProduct;
}

async function getProductById(req, res, next){
    const idproducto = req.params.idproducto;
    req.product = await sequelize.query(`SELECT * FROM products WHERE product_id = ${idproducto}`, 
    { type: sequelize.QueryTypes.SELECT });
    next()
}

async function addProduct(req, res, next) {
    if(req.usuario.is_admin) {
        await sequelize.query(`${insertQuery('INSERT','products',req.body)}`,
        replacementsQuery(req.body));
        return next()
    } else {
        res.status(409).send('No tienes permiso');
    }    
}

async function deleteProduct(req, res, next) {
    const id = req.params.idproducto;
    try {
        if(req.usuario.is_admin) {
            await sequelize.query(`DELETE FROM products WHERE product_id = ${id}`, { raw: true });
            return next();
        } else {
            res.status(409).json('No estas autorizado')
        }
    } catch (err) {
        return res.status(404).json(`Algo salió mal. Error: ${err}`);
    }
}
async function UpdateProduct(req, res, next) {
    const id = req.params.idproducto;
    try {
        if(req.usuario.is_admin){
            await sequelize.query(`${updateQuery('UPDATE', 'products', req.body, 'product_id', id)}`,
            replacementsQuery(req.body));
            return next();
        } else {
            res.status(409).json('No estas autorizado')
        }
    } catch (err) {
        return res.status(404).json(`Algo salió mal. Error: ${err}`);
    }
}

module.exports = {
    findProductById,
    productValidator,
    getProducts,
    getFavorites,
    getProductById,
    addProduct,
    deleteProduct,
    UpdateProduct,
}