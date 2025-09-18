// Database client for renderer process
class DatabaseClient {
    constructor() {
        this.ipcRenderer = require('electron').ipcRenderer;
    }

    // Dashboard statistics
    async getDashboardStats() {
        return await this.ipcRenderer.invoke('db-get-dashboard-stats');
    }

    // Customer operations
    async getCustomers(limit = 100, offset = 0) {
        return await this.ipcRenderer.invoke('db-get-customers', limit, offset);
    }

    async createCustomer(customerData) {
        return await this.ipcRenderer.invoke('db-create-customer', customerData);
    }

    // Product operations
    async getProducts(limit = 100, offset = 0) {
        return await this.ipcRenderer.invoke('db-get-products', limit, offset);
    }

    async createProduct(productData) {
        return await this.ipcRenderer.invoke('db-create-product', productData);
    }

    async updateProduct(productId, productData) {
        return await this.ipcRenderer.invoke('db-update-product', productId, productData);
    }

    async deleteProduct(productId) {
        return await this.ipcRenderer.invoke('db-delete-product', productId);
    }

    async getProductById(productId) {
        return await this.ipcRenderer.invoke('db-get-product-by-id', productId);
    }

    // Measurement operations
    async getMeasurements(customerId = null, limit = 100, offset = 0) {
        return await this.ipcRenderer.invoke('db-get-measurements', customerId, limit, offset);
    }

    async createMeasurement(measurementData) {
        return await this.ipcRenderer.invoke('db-create-measurement', measurementData);
    }

    // Search operations
    async searchCustomers(query) {
        return await this.ipcRenderer.invoke('db-search-customers', query);
    }

    async searchProducts(query) {
        return await this.ipcRenderer.invoke('db-search-products', query);
    }
}

// Global database client instance
window.db = new DatabaseClient();