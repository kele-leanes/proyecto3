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

module.exports = {
    updateQuery,
    replacementsQuery,
    insertQuery
};