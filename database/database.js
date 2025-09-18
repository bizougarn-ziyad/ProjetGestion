const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor(dbPath = null) {
        // Use user data directory for the database in production
        const { app } = require('electron');
        const userDataPath = app ? app.getPath('userData') : __dirname;
        this.dbPath = dbPath || path.join(userDataPath, 'clothing_management.db');
        this.db = null;
    }

    // Initialize database connection
    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log(`Connected to SQLite database at ${this.dbPath}`);
                    // Enable foreign keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve();
                }
            });
        });
    }

    // Initialize database with schema
    async initialize() {
        try {
            await this.connect();

            // Read and execute schema file
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');

            // Split schema into individual statements
            const statements = schema.split(';').filter(stmt => stmt.trim());

            for (const statement of statements) {
                if (statement.trim()) {
                    await this.run(statement);
                }
            }

            console.log('Database initialized successfully');

            // Migration disabled to avoid duplicate column errors
            // await this.runMigrations();
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    // Run database migrations to add missing columns
    async runMigrations() {
        try {
            // Check if additional product columns exist, if not add them
            const columnsToAdd = [
                { name: 'size', type: 'TEXT' },
                { name: 'color', type: 'TEXT' },
                { name: 'brand', type: 'TEXT' },
                { name: 'material', type: 'TEXT' },
                { name: 'sku', type: 'TEXT' } // Removed UNIQUE constraint for ALTER TABLE
            ];

            for (const column of columnsToAdd) {
                try {
                    // Try to add the column, ignore if it already exists
                    await this.run(`ALTER TABLE products ADD COLUMN ${column.name} ${column.type}`);
                    console.log(`Added column ${column.name} to products table`);
                } catch (error) {
                    // Column probably already exists, ignore the error
                    if (!error.message.includes('duplicate column name')) {
                        console.error(`Error adding column ${column.name}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error('Error running migrations:', error);
        }
    }

    // Execute a query that doesn't return rows
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error('Database run error:', err.message);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Execute a query that returns a single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Database get error:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Execute a query that returns multiple rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database all error:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Close database connection
    close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                    } else {
                        console.log('Database connection closed');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // Get database statistics for dashboard
    async getStats() {
        try {
            const stats = {};

            // Get customer count
            const customerCount = await this.get('SELECT COUNT(*) as count FROM customers');
            stats.totalCustomers = customerCount.count;

            // Get product count
            const productCount = await this.get('SELECT COUNT(*) as count FROM products');
            stats.totalProducts = productCount.count;

            // Get order count and revenue
            const orderStats = await this.get(`
                SELECT 
                    COUNT(*) as totalOrders,
                    COALESCE(SUM(total_amount), 0) as totalRevenue
                FROM orders
            `);
            stats.totalOrders = orderStats.totalOrders;
            stats.totalRevenue = orderStats.totalRevenue;

            // Get recent orders count (last 30 days)
            const recentOrders = await this.get(`
                SELECT COUNT(*) as count 
                FROM orders 
                WHERE created_at >= datetime('now', '-30 days')
            `);
            stats.recentOrders = recentOrders.count;

            return stats;
        } catch (error) {
            console.error('Error getting database stats:', error);
            return {};
        }
    }
}

module.exports = Database;