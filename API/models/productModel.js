const db = require('../config/db');

const product = {
  create: async (data) => {
    const sql = 'INSERT INTO product (name, url, img, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())';
    try {
      const [results] = await db.execute(sql, [data.name, data.url, data.img]);
      
      let dataJSON = {
        status: 'success',
        data: results
    }
      return dataJSON;
    } catch (err) {
      throw err;
    }
  },
  
  getAll: async () => {
    try {
      const [results] = await db.execute('SELECT * FROM product ORDER BY created_at DESC');
      
      let dataJSON = {
        status: 'success',
        data: results
    }
      return dataJSON;
    } catch (err) {
      throw err;
    }
  },  

  update: async (id, data) => {
    const sql = 'UPDATE product SET name = ?, url = ?, img = ?, updated_at = NOW() WHERE id = ?';
    try {
      const [results] = await db.execute(sql, [data.name, data.url, data.img, id]);
      
      let dataJson = {
        status: 'success',
        data: results
    }
      return dataJson;
    } catch (err) {
      throw err;
    }
  },

  delete: async (id) => {
    try {
      const [results] = await db.execute('DELETE FROM product WHERE id = ?', [id]);
      
      return results;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = product;
