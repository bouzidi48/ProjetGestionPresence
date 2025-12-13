const mysql = require('mysql');
class MySQLRepository {
    constructor(source, host='localhost', user ='mohammed', password='1234') {
        this.params = {host,database : source,user,password};
        this.db = mysql.createConnection(this.params);
    }

    open() {
        return new Promise((resolve, reject) => {
            this.db.connect((err) => {
                if (err) {
                    reject(err);
                } 
                else {
                    resolve('Connexion bien établie ...');
                }
            });
        });
    }
    select(tableName, key, value) {
        return new Promise((resolve, reject) => {
            let query;
        
            if(key == undefined) {
                // Pas de condition WHERE
                query = `SELECT * FROM ${tableName}`;
            }
            else {
                // ✅ Vérifier si la valeur est null
                if (value === null) {
                    query = `SELECT * FROM ${tableName} WHERE ${key} IS NULL`;
                } else {
                    query = `SELECT * FROM ${tableName} WHERE ${key} = '${value}'`;
                }
            }
        
            this.db.query(query, (err, result, fields) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve({result, fields: fields.map(f => f.name)});
                }
            });
        });
    }

    async selectMultiAnd(tableName, key, values) {
        // Validation
        if (!values || values.length === 0) {
            return { result: [] };
        }

        try {
            // Exécuter toutes les requêtes en parallèle
            const promises = values.map(v => this.select(tableName, key, v));
            const results = await Promise.all(promises);
            console.log('Résultats bruts des requêtes AND :', results.length);
            console.log('Résultats de chaque requête AND :', results[0].result, results[1].result, results.length > 2 ? results[2].result : '...');

            // Vérifier si l'un des résultats est vide
            if (results.some(r => r.result.length === 0)) {
                console.log('Au moins un des résultats est vide, retour d\'un tableau vide.');
                return { result: [] };
            }

            let list = []
            for (let i = 0; i < (results.length); i++) {
                list.push(results[i].result[0]);
            }
            console.log('Intersection des résultats AND :', list);
            return { 
                result: list,
                fields: results[0].fields 
            };
        } catch (error) {
            throw error;
        }
    }

    /**
    * Sélectionne des enregistrements avec plusieurs conditions (key = value)
    * @param {string} tableName - Nom de la table
    * @param {Object} conditions - Objet avec les paires clé/valeur { key1: value1, key2: value2 }
    * @returns {Promise<Object>} - { result: [], fields: [] }
    * 
    * Exemple d'utilisation:
    * selectMulti('users', { role: 'etudiant', actif: 1 })
    * → SELECT * FROM users WHERE role = 'etudiant' AND actif = 1
    */
    selectMulti(tableName, conditions) {
        // Validation
        if (!conditions || Object.keys(conditions).length === 0) {
            return { result: [] };
        }
        const keys = Object.keys(conditions);
        const values = Object.values(conditions);
    
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM ${tableName} WHERE`;
        
            for (let i = 0; i < values.length; i++) {
                // Vérifier si la valeur est null
                if (values[i] === null) {
                    query += ` ${keys[i]} IS NULL AND`;
                } else {
                    query += ` ${keys[i]} = '${values[i]}' AND`;
                }
            }
        
            query = query.slice(0, -4); // Remove the last ' AND'
        
            this.db.query(query, (err, result, fields) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve({result, fields: fields.map(f => f.name)});
                }
            });
        });
    }
    

    selectMultiOr(tableName, key, value) {
        return new Promise((resolve, reject) => {
            let query;
            if(key == undefined) {
                query = `SELECT * FROM ${tableName}`
            }
            else {
                query = `SELECT * FROM ${tableName} WHERE`;
                for (let i = 0; i < value.length; i++) {
                    query += ` ${key} = '${value[i]}' Or`;
                }
                query = query.slice(0, -2); // Remove the last ' And '
                
            }
            
            this.db.query(query, (err, result,fields) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve({result,fields : fields.map(f => f.name)});
                }
            })
        })
    }

    selectLike(tableName, key, value) {
        let query = `SELECT * FROM ${tableName}
                            WHERE ${key} LIKE '%${value}%'
                        `;
            
        return new Promise((resolve, reject) => {
            this.db.query(query, (err, result,fields) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve({result,fields : fields.map(f => f.name)});
                }
            })
        })
    }
    insert(tableName, row) {
        return new Promise((resolve, reject) => {
            // Créer une copie sans l'id si id = -1
            const dataToInsert = { ...row };
            if (dataToInsert.id === -1 || dataToInsert.id === undefined) {
                delete dataToInsert.id;
            }
        
            const keys = Object.keys(dataToInsert);
            const values = Object.values(dataToInsert);
            const placeholders = keys.map(() => '?').join(', ');
            const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
            
            this.db.query(query, values, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        success: result.affectedRows === 1,
                        insertId: result.insertId,
                        affectedRows: result.affectedRows
                    });
                }
            });
        });
    }
    update(tableName, row, key = 'id') {
        return new Promise((resolve, reject) => {
            // Vérifier que la clé existe dans row
            if (row[key] === undefined) {
                reject(new Error(`La clé '${key}' n'existe pas dans l'objet`));
                return;
            }

            const keyValue = row[key];
        
            // Créer une copie sans la clé pour l'UPDATE
            const dataToUpdate = { ...row };
            delete dataToUpdate[key];

            const keys = Object.keys(dataToUpdate);
            const values = Object.values(dataToUpdate);
        
            // Créer la clause SET (colonne = ?, colonne = ?, ...)
            const setClause = keys.map(k => `${k} = ?`).join(', ');
        
            const query = `UPDATE ${tableName} SET ${setClause} WHERE ${key} = ?`;
        
            // Ajouter la valeur de la clé à la fin des paramètres
            const params = [...values, keyValue];
        
            this.db.query(query, params, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        success: result.affectedRows > 0,
                        affectedRows: result.affectedRows,
                        changedRows: result.changedRows
                    });
                }
            });
        });
    }
    delete(tableName, keyValue, key = 'id') {
        return new Promise((resolve, reject) => {
            // Vérifier que la valeur de la clé est fournie
            if (keyValue === undefined || keyValue === null) {
                reject(new Error(`La valeur de la clé '${key}' doit être fournie`));
                return;
            }

            const query = `DELETE FROM ${tableName} WHERE ${key} = ?`;
        
            this.db.query(query, [keyValue], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        success: result.affectedRows > 0,
                        affectedRows: result.affectedRows
                    });
                }
            });
        });
    }
    close() {
        this.db.end();
    }
}
module.exports = MySQLRepository;