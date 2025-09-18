const { app, BrowserWindow, screen, ipcMain } = require('electron')
const DatabaseAPI = require('./database/api')

let mainWindow = null
let dbAPI = null

// Initialize database
const initializeDatabase = async () => {
    try {
        dbAPI = new DatabaseAPI()
        await dbAPI.initialize()
        console.log('Database initialized successfully')
    } catch (error) {
        console.error('Failed to initialize database:', error)
    }
}

const createWindow = () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        fullscreen: true,
        autoHideMenuBar: true,
        icon: './src/images/logo.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    })

    mainWindow.loadFile('index.html')

    // Handle fullscreen changes - maximize when exiting fullscreen
    mainWindow.on('leave-full-screen', () => {
        mainWindow.maximize()
    })
}

const createNewWindow = () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    const newWin = new BrowserWindow({
        width: width,
        height: height,
        fullscreen: true,
        autoHideMenuBar: true,
        icon: './src/images/logo.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    })

    newWin.loadFile('page2.html')

    // Handle fullscreen changes - maximize when exiting fullscreen
    newWin.on('leave-full-screen', () => {
        newWin.maximize()
    })

    // Close the main window when new window is opened
    if (mainWindow) {
        mainWindow.close()
    }
}

app.whenReady().then(async () => {
    // Initialize database first
    await initializeDatabase()

    // Set app icon for dock/taskbar (macOS/Linux)
    if (process.platform === 'darwin' || process.platform === 'linux') {
        app.dock?.setIcon('./src/images/logo.png');
    }
    createWindow()
})

// Handle IPC message to open new window
ipcMain.on('open-new-window', () => {
    createNewWindow()
})

// Database IPC handlers
ipcMain.handle('db-get-dashboard-stats', async () => {
    try {
        return await dbAPI.getDashboardStats()
    } catch (error) {
        console.error('Error getting dashboard stats:', error)
        return {}
    }
})

ipcMain.handle('db-get-customers', async (event, limit, offset) => {
    try {
        return await dbAPI.getCustomers(limit, offset)
    } catch (error) {
        console.error('Error getting customers:', error)
        return []
    }
})

ipcMain.handle('db-create-customer', async (event, customerData) => {
    try {
        return await dbAPI.createCustomer(customerData)
    } catch (error) {
        console.error('Error creating customer:', error)
        throw error
    }
})

ipcMain.handle('db-get-products', async (event, limit, offset) => {
    try {
        return await dbAPI.getProducts(limit, offset)
    } catch (error) {
        console.error('Error getting products:', error)
        return []
    }
})

ipcMain.handle('db-create-product', async (event, productData) => {
    try {
        return await dbAPI.createProduct(productData)
    } catch (error) {
        console.error('Error creating product:', error)
        throw error
    }
})

ipcMain.handle('db-update-product', async (event, productId, productData) => {
    try {
        return await dbAPI.updateProduct(productId, productData)
    } catch (error) {
        console.error('Error updating product:', error)
        throw error
    }
})

ipcMain.handle('db-delete-product', async (event, productId) => {
    try {
        return await dbAPI.deleteProduct(productId)
    } catch (error) {
        console.error('Error deleting product:', error)
        throw error
    }
})

ipcMain.handle('db-get-product-by-id', async (event, productId) => {
    try {
        console.log('IPC: Getting product by ID:', productId); // Debug log
        const product = await dbAPI.getProductById(productId);
        console.log('IPC: Found product:', product); // Debug log
        return product;
    } catch (error) {
        console.error('Error getting product by ID:', error)
        throw error
    }
})

ipcMain.handle('db-get-measurements', async (event, customerId, limit, offset) => {
    try {
        return await dbAPI.getMeasurements(customerId, limit, offset)
    } catch (error) {
        console.error('Error getting measurements:', error)
        return []
    }
})

ipcMain.handle('db-create-measurement', async (event, measurementData) => {
    try {
        return await dbAPI.createMeasurement(measurementData)
    } catch (error) {
        console.error('Error creating measurement:', error)
        throw error
    }
})

ipcMain.handle('db-search-customers', async (event, query) => {
    try {
        return await dbAPI.searchCustomers(query)
    } catch (error) {
        console.error('Error searching customers:', error)
        return []
    }
})

ipcMain.handle('db-search-products', async (event, query) => {
    try {
        return await dbAPI.searchProducts(query)
    } catch (error) {
        console.error('Error searching products:', error)
        return []
    }
})

// Clean up database connection when app is closing
app.on('before-quit', async () => {
    if (dbAPI) {
        await dbAPI.close()
    }
})