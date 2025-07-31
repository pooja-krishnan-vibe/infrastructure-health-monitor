const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const winston = require('winston');

const Database = require('./models/database');
const MonitoringService = require('./services/monitoringService');

// Configure logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Create logs directory
const fs = require('fs');
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Initialize database and monitoring service
const db = new Database();
const monitoringService = new MonitoringService(io);

// Socket.io connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });

    // Send current status to newly connected client
    monitoringService.getCurrentStatus().then(components => {
        socket.emit('initialStatus', components);
    });
});

// API Routes

// Get all components with current status
app.get('/api/components', async (req, res) => {
    try {
        const components = await db.getAllComponents();
        res.json(components);
    } catch (error) {
        logger.error('Error fetching components:', error);
        res.status(500).json({ error: 'Failed to fetch components' });
    }
});

// Get component details with history
app.get('/api/components/:id', async (req, res) => {
    try {
        const componentId = parseInt(req.params.id);
        const hours = parseInt(req.query.hours) || 24;
        
        const components = await db.getAllComponents();
        const component = components.find(c => c.id === componentId);
        
        if (!component) {
            return res.status(404).json({ error: 'Component not found' });
        }

        const history = await db.getStatusHistory(componentId, hours);
        
        res.json({
            ...component,
            history
        });
    } catch (error) {
        logger.error('Error fetching component details:', error);
        res.status(500).json({ error: 'Failed to fetch component details' });
    }
});

// Get maintenance schedules
app.get('/api/maintenance', async (req, res) => {
    try {
        const upcoming = req.query.upcoming === 'true';
        const schedules = await db.getMaintenanceSchedules(upcoming);
        res.json(schedules);
    } catch (error) {
        logger.error('Error fetching maintenance schedules:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance schedules' });
    }
});

// Add maintenance schedule
app.post('/api/maintenance', async (req, res) => {
    try {
        const { componentId, title, description, scheduledStart, scheduledEnd } = req.body;
        
        if (!componentId || !title || !scheduledStart || !scheduledEnd) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const id = await db.addMaintenanceSchedule(
            componentId, 
            title, 
            description, 
            scheduledStart, 
            scheduledEnd
        );
        
        // Emit maintenance update to all clients
        io.emit('maintenanceUpdate', {
            action: 'added',
            schedule: { id, componentId, title, description, scheduledStart, scheduledEnd }
        });
        
        res.json({ id, message: 'Maintenance schedule added successfully' });
    } catch (error) {
        logger.error('Error adding maintenance schedule:', error);
        res.status(500).json({ error: 'Failed to add maintenance schedule' });
    }
});

// Get dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const components = await db.getAllComponents();
        
        const stats = {
            total: components.length,
            online: components.filter(c => c.status === 'online').length,
            offline: components.filter(c => c.status === 'offline').length,
            unknown: components.filter(c => c.status === 'unknown').length,
            categories: {}
        };

        // Group by category
        components.forEach(component => {
            if (!stats.categories[component.category]) {
                stats.categories[component.category] = {
                    total: 0,
                    online: 0,
                    offline: 0,
                    unknown: 0
                };
            }
            
            stats.categories[component.category].total++;
            stats.categories[component.category][component.status]++;
        });

        res.json(stats);
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    
    // Start monitoring service
    monitoringService.startMonitoring();
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down server...');
    monitoringService.stopMonitoring();
    server.close(() => {
        logger.info('Server shutdown complete');
        process.exit(0);
    });
});

module.exports = { app, server, io }; 