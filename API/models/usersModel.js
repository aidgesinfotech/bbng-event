const db = require('../config/db');

const Users = {
    create: async (latitude , longitude , data, userDetails) => {
        const sql = 'INSERT INTO users (name, password, mobile, email, roleId, isActive,latitude, longitude, ip, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
        try {
            const [results] = await db.execute(sql, [data.name, data.password, data.mobile, data.email, data.roleId, data.isActive, latitude, longitude, data.ip]);


            let dataJSON = {
                status: 'success',
                data: results
            }

            return dataJSON;
        } catch (err) {
            throw err; // Propagate the error to be handled later
        }
    },

    getAll: async () => {
        try {
            const [results] = await db.execute(`SELECT users.*, roles.roleName FROM users LEFT JOIN roles ON users.roleId = roles.id ORDER BY created_at DESC`);

            const modifiedResults = results.map(user => ({
                ...user,
                roleName: user.roleName
            }));

            let dataJSON = {
                status: 'success',
                data: modifiedResults
            };

            return dataJSON;
        } catch (err) {
            throw err;
        }
    },

    
        
    getAllByPage: async (limit, pageNo, searchtxt) => {
        try {
            const offset = (pageNo - 1) * limit;
    
            // Base query with LEFT JOIN on the roles table
            let query = `
                SELECT 
                    users.*, 
                    roles.roleName 
                FROM 
                    users
                LEFT JOIN 
                    roles ON users.roleId = roles.id
            `;
            let queryParams = [];
    
            // Apply search filter if search text is provided
            if (searchtxt) {
                const columns = ['users.name', 'users.password', 'users.mobile', 'users.email'];  // Specify table for columns
                const searchConditions = columns.map(col => `${col} LIKE ?`).join(' OR ');
                query += ` WHERE ${searchConditions}`;
                queryParams = columns.map(() => `%${searchtxt}%`);
            }
    
            // Apply ordering and pagination
            query += ' ORDER BY users.created_at DESC LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);
    
            // Execute the query to get paginated results with the roleName from the roles table
            const [results] = await db.execute(query, queryParams);
    
            // Get the total count of users (without filtering for pagination purposes)
            const [totalCountResults] = await db.execute('SELECT COUNT(*) AS totalCount FROM users');
            const totalCount = totalCountResults[0].totalCount;
    
            // Modify results to include roleName (this is already handled by the JOIN, but we can add it explicitly if needed)
            const modifiedResults = results.map(user => ({
                ...user,
                roleName: user.roleName  // Adding the roleName from the join (though it already exists)
            }));
    
            return {
                status: 'success',
                data: modifiedResults,
                totalCount: totalCount
            };
        } catch (err) {
            throw err;
        }
    },    


    getUserStatus: async (id) => {
        const sql = 'SELECT * FROM users WHERE id = ?';
        try {
            const [results] = await db.execute(sql, [id]);

            let status =  results[0].isActive;

            return status;
        } catch (err) {
            throw err;
        }
    },

    update: async (id, data, userDetails) => {
        const sqlUpdate = 'UPDATE users SET name = ?, password = ?, roleId = ?, isActive = ?, mobile = ?, email = ?,latitude = ?, longitude = ?, ip = ?,  updated_at = NOW() WHERE id = ?';
        try {
            const [updateResults] = await db.execute(sqlUpdate, [data.name, data.password, data.roleId, data.isActive, data.mobile, data.email,'-' , '-' , data.ip,  id]);


            const sqlSelect = 'SELECT * FROM users WHERE id = ?';
            const [updatedUser] = await db.execute(sqlSelect, [id]);

            if (updatedUser.length === 0) {
                throw new Error('User not found');
            }

            let dataJSON = {
                status: 'success',
                data: updatedUser[0]
            }

            return dataJSON;
        } catch (err) {
            throw err;
        }
    },
    updateUserToken: async (id, data) => {
        const sqlUpdate = 'UPDATE users SET token = ?, updated_at = NOW() WHERE id = ?';
        try {
            db.execute(sqlUpdate, [data, id]);
        } catch (err) {
            throw err;
        }
    },

    updateUserStatus: async (id, isActive, userDetails) => {
        const sql = 'UPDATE users SET isActive = ?, updated_at = NOW() WHERE id = ?';
        try {
            const [results] = await db.execute(sql, [isActive, id]);


            let dataJSON = {
                status: 'success',
                data: results
            };

            return dataJSON;
        } catch (err) {
            throw err;
        }
    },

    delete: async (id, userDetails) => {
        try {
            const [results] = await db.execute('DELETE FROM users WHERE id = ?', [id]);

            return results;
        } catch (err) {
            throw err;
        }
    },
    findByEmail: async (lat, lon , email, ip) => {
        const sql = 'SELECT * FROM users WHERE email = ?';
        try {

            const [results] = await db.execute(sql, [email]);

            if (results.length > 0) {
                await db.execute('UPDATE users SET latitude = ?, longitude = ?, ip = ? WHERE id = ?', [lat, lon, ip, results[0].id]);

                return {
                    status: 'success',
                    data: results[0]
                };
            } else {
                return {
                    status: 'not_found',
                    data: null
                };
            }
        } catch (err) {
            throw err;
        }
    },
    getPagesByPermissionIds: async (permissions, user) => {
        if (!permissions || permissions.length === 0) return [];

        const permissionIds = permissions.map(permission => permission.action && permission.pageid);

        const placeholders = permissionIds.map(() => '?').join(', ');

        const sql = `SELECT * FROM pages WHERE pageId IN (${placeholders})`;
        // const sql = `SELECT
        //   pages.*, 
        //   permissions.action AS action
        // FROM pages
        // LEFT JOIN permissions ON pages.pageId = permissions.pageid AND permissions.roleid = ${user.data.roleId}
        // WHERE pageId IN (${placeholders})`;
        // const sql = `
        // SELECT pages.*, permissions.action AS action FROM pages LEFT JOIN permissions ON pages.pageId = permissions.pageid AND ${user.data.roleId} = permissions.roleid WHERE pageId IN (${placeholders})`;

        try {
            const [results] = await db.execute(sql, permissionIds);
            results.forEach(e => {
                let permissionAction = permissions.find(f => f.pageid == e.pageId).action;
                e['action'] = permissionAction;
            });
            return results;
        } catch (err) {
            throw err;
        }
    },
    getPermissionsByRoleId: async (roleId) => {
        const sql = 'SELECT * FROM permissions WHERE roleid = ?';
        try {
            const [results] = await db.execute(sql, [roleId]);
            return results;
        } catch (err) {
            throw err;
        }
    },
    verifyPassword: async function (inputPassword, storedPassword) {
        try {
            return inputPassword === storedPassword;
        } catch (err) {
            throw err;
        }
    },
};

module.exports = Users;