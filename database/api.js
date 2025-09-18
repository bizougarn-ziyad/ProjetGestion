const Database = require('./database');

class DatabaseAPI {
    constructor() {
        this.db = new Database();
    }

    async initialize() {
        await this.db.initialize();
        await this.initializeDefaultCategories();
    }

    // Initialize default product categories
    async initializeDefaultCategories() {
        const categories = [
            { id: 1, name: 'Shirts', description: 'Shirts and tops' },
            { id: 2, name: 'Pants', description: 'Pants and trousers' },
            { id: 3, name: 'Dresses', description: 'Dresses and gowns' },
            { id: 4, name: 'Jackets', description: 'Jackets and outerwear' },
            { id: 5, name: 'Accessories', description: 'Accessories and extras' },
            { id: 6, name: 'Shoes', description: 'Footwear' },
            { id: 7, name: 'Underwear', description: 'Undergarments' },
            { id: 8, name: 'Other', description: 'Other items' }
        ];

        for (const category of categories) {
            try {
                const sql = `
                    INSERT OR IGNORE INTO product_categories (id, name, description)
                    VALUES (?, ?, ?)
                `;
                await this.db.run(sql, [category.id, category.name, category.description]);
            } catch (error) {
                console.error(`Error inserting category ${category.name}:`, error);
            }
        }
    }

    // Customer operations
    async getCustomers(limit = 100, offset = 0) {
        const sql = `
            SELECT c.*, 
                   COUNT(m.id) as measurement_count,
                   COUNT(o.id) as order_count
            FROM customers c
            LEFT JOIN measurements m ON c.id = m.customer_id
            LEFT JOIN orders o ON c.id = o.customer_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `;
        return await this.db.all(sql, [limit, offset]);
    }

    async getCustomerById(id) {
        const sql = 'SELECT * FROM customers WHERE id = ?';
        return await this.db.get(sql, [id]);
    }

    async createCustomer(customerData) {
        const { name, email, phone, address } = customerData;
        const sql = `
            INSERT INTO customers (name, email, phone, address)
            VALUES (?, ?, ?, ?)
        `;
        const result = await this.db.run(sql, [name, email, phone, address]);
        return await this.getCustomerById(result.id);
    }

    async updateCustomer(id, customerData) {
        const { name, email, phone, address } = customerData;
        const sql = `
            UPDATE customers 
            SET name = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await this.db.run(sql, [name, email, phone, address, id]);
        return await this.getCustomerById(id);
    }

    async deleteCustomer(id) {
        const sql = 'DELETE FROM customers WHERE id = ?';
        return await this.db.run(sql, [id]);
    }

    // Product operations
    async getProducts(limit = 100, offset = 0) {
        const sql = `
            SELECT p.*, pc.name as category_name
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;
        return await this.db.all(sql, [limit, offset]);
    }

    async getProductById(id) {
        const sql = `
            SELECT p.*, pc.name as category_name
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            WHERE p.id = ?
        `;
        return await this.db.get(sql, [id]);
    }

    async createProduct(productData) {
        const { name, description, category_id, price, stock_quantity, image_url } = productData;
        const sql = `
            INSERT INTO products (name, description, category_id, price, stock_quantity, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await this.db.run(sql, [name, description, category_id, price, stock_quantity, image_url]);
        return await this.getProductById(result.id);
    }

    async updateProduct(id, productData) {
        const { name, description, category_id, price, stock_quantity, image_url } = productData;
        const sql = `
            UPDATE products 
            SET name = ?, description = ?, category_id = ?, price = ?, stock_quantity = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await this.db.run(sql, [name, description, category_id, price, stock_quantity, image_url, id]);
        return await this.getProductById(id);
    }

    async deleteProduct(id) {
        const sql = 'DELETE FROM products WHERE id = ?';
        return await this.db.run(sql, [id]);
    }

    // Measurement operations
    async getMeasurements(customerId = null, limit = 100, offset = 0) {
        let sql, params;
        if (customerId) {
            sql = `
                SELECT m.*, c.name as customer_name
                FROM measurements m
                JOIN customers c ON m.customer_id = c.id
                WHERE m.customer_id = ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            `;
            params = [customerId, limit, offset];
        } else {
            sql = `
                SELECT m.*, c.name as customer_name
                FROM measurements m
                JOIN customers c ON m.customer_id = c.id
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            `;
            params = [limit, offset];
        }
        return await this.db.all(sql, params);
    }

    async getMeasurementById(id) {
        const sql = `
            SELECT m.*, c.name as customer_name
            FROM measurements m
            JOIN customers c ON m.customer_id = c.id
            WHERE m.id = ?
        `;
        return await this.db.get(sql, [id]);
    }

    async createMeasurement(measurementData) {
        const {
            customer_id, garment_type, chest, waist, length,
            shoulder, sleeve, neck, hip, inseam, notes, measured_by
        } = measurementData;

        const sql = `
            INSERT INTO measurements 
            (customer_id, garment_type, chest, waist, length, shoulder, sleeve, neck, hip, inseam, notes, measured_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await this.db.run(sql, [
            customer_id, garment_type, chest, waist, length,
            shoulder, sleeve, neck, hip, inseam, notes, measured_by
        ]);

        return await this.getMeasurementById(result.id);
    }

    async updateMeasurement(id, measurementData) {
        const {
            customer_id, garment_type, chest, waist, length,
            shoulder, sleeve, neck, hip, inseam, notes, measured_by
        } = measurementData;

        const sql = `
            UPDATE measurements 
            SET customer_id = ?, garment_type = ?, chest = ?, waist = ?, length = ?, 
                shoulder = ?, sleeve = ?, neck = ?, hip = ?, inseam = ?, notes = ?, 
                measured_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await this.db.run(sql, [
            customer_id, garment_type, chest, waist, length,
            shoulder, sleeve, neck, hip, inseam, notes, measured_by, id
        ]);

        return await this.getMeasurementById(id);
    }

    async deleteMeasurement(id) {
        const sql = 'DELETE FROM measurements WHERE id = ?';
        return await this.db.run(sql, [id]);
    }

    // Order operations
    async getOrders(limit = 100, offset = 0) {
        const sql = `
            SELECT o.*, c.name as customer_name, c.email as customer_email
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `;
        return await this.db.all(sql, [limit, offset]);
    }

    async getOrderById(id) {
        const sql = `
            SELECT o.*, c.name as customer_name, c.email as customer_email
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        `;
        return await this.db.get(sql, [id]);
    }

    async createOrder(orderData) {
        const { customer_id, order_number, status, total_amount, payment_status, notes, delivery_date } = orderData;
        const sql = `
            INSERT INTO orders (customer_id, order_number, status, total_amount, payment_status, notes, delivery_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await this.db.run(sql, [customer_id, order_number, status, total_amount, payment_status, notes, delivery_date]);
        return await this.getOrderById(result.id);
    }

    // Dashboard statistics
    async getDashboardStats() {
        const stats = await this.db.getStats();

        // Get monthly sales data for chart
        const monthlySales = await this.db.all(`
            SELECT 
                strftime('%m', created_at) as month,
                COUNT(*) as order_count,
                SUM(total_amount) as revenue
            FROM orders
            WHERE created_at >= datetime('now', '-12 months')
            GROUP BY strftime('%m', created_at)
            ORDER BY month
        `);

        // Get top products
        const topProducts = await this.db.all(`
            SELECT 
                p.name,
                p.price,
                p.stock_quantity,
                COUNT(oi.id) as sales_count
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.id
            ORDER BY sales_count DESC
            LIMIT 10
        `);

        // Get recent measurements
        const recentMeasurements = await this.getMeasurements(null, 5, 0);

        return {
            ...stats,
            monthlySales,
            topProducts,
            recentMeasurements
        };
    }

    // Search functionality
    async searchCustomers(query) {
        const sql = `
            SELECT * FROM customers 
            WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
            ORDER BY name
            LIMIT 20
        `;
        const searchTerm = `%${query}%`;
        return await this.db.all(sql, [searchTerm, searchTerm, searchTerm]);
    }

    async searchProducts(query) {
        const sql = `
            SELECT p.*, pc.name as category_name
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            WHERE p.name LIKE ? OR p.description LIKE ?
            ORDER BY p.name
            LIMIT 20
        `;
        const searchTerm = `%${query}%`;
        return await this.db.all(sql, [searchTerm, searchTerm]);
    }

    // Close database connection
    async close() {
        await this.db.close();
    }
}

module.exports = DatabaseAPI;