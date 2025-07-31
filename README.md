# Infrastructure Health Monitoring Dashboard

A real-time infrastructure health monitoring dashboard that provides live status indicators, scheduled maintenance alerts, and historical uptime reports for various infrastructure components including Wi-Fi networks, VPN servers, printers, and conference room equipment.

![Dashboard Preview](https://via.placeholder.com/800x400/3b82f6/white?text=Infrastructure+Health+Monitor)

## Features

✅ **Real-time Status Monitoring**
- Live status indicators for all infrastructure components
- WebSocket-based real-time updates
- Automatic health checks with configurable intervals

✅ **Component Management**
- Support for multiple component types (ping, HTTP/HTTPS, TCP)
- Categorized view (Network, Printers, Conference Rooms, Servers)
- Detailed component information and configuration

✅ **Maintenance Scheduling**
- Schedule planned maintenance windows
- Active maintenance notifications
- Maintenance history tracking

✅ **Historical Analytics**
- Uptime percentage calculations
- Response time trends and charts
- Historical data visualization
- Configurable time ranges (6h to 72h)

✅ **Modern UI/UX**
- Responsive design with Tailwind CSS
- Component filtering and search
- Real-time status badges and indicators
- Interactive charts and graphs

✅ **Integration Ready**
- API endpoints for external monitoring tools
- JSON-based configuration
- Extensible architecture for Nagios, Zabbix integration

## Architecture

```
├── backend/              # Node.js Express API server
│   ├── models/          # Database models and queries
│   ├── services/        # Monitoring and business logic
│   ├── scripts/         # Database initialization
│   └── server.js        # Main server entry point
├── frontend/            # React TypeScript dashboard
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API and WebSocket clients
│   │   └── types/       # TypeScript definitions
│   └── public/          # Static assets
└── data/               # SQLite database storage
```

## Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd infrastructure-health-monitoring
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Initialize the database**
   ```bash
   cd backend
   npm run init-db
   cd ..
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Configuration

### Adding Components

Components can be added by modifying the database initialization script or using the API endpoints:

```sql
INSERT INTO components (name, type, category, host, description) VALUES
('New Printer', 'ping', 'printer', '192.168.1.102', 'Color printer on third floor');
```

### Component Types

- **ping**: ICMP ping checks for basic connectivity
- **http/https**: HTTP endpoint monitoring
- **tcp**: TCP port connectivity checks

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3001
NODE_ENV=production
DB_PATH=./data/monitoring.db
LOG_LEVEL=info
```

## API Endpoints

### Components
- `GET /api/components` - Get all components with current status
- `GET /api/components/:id` - Get component details with history
- `GET /api/dashboard/stats` - Get dashboard statistics

### Maintenance
- `GET /api/maintenance` - Get maintenance schedules
- `POST /api/maintenance` - Create new maintenance schedule

### Health Check
- `GET /api/health` - API health status

## WebSocket Events

The application uses WebSocket for real-time updates:

- `initialStatus` - Initial component status on connection
- `statusUpdate` - Real-time status changes
- `maintenanceUpdate` - Maintenance schedule updates

## Database Schema

The application uses SQLite with the following tables:

- `components` - Infrastructure component definitions
- `current_status` - Latest status for each component
- `status_history` - Historical status data
- `maintenance_schedules` - Planned maintenance windows
- `alert_configs` - Alert configuration settings

## Monitoring Integration

### Nagios Integration

Create a script to sync Nagios status:

```bash
#!/bin/bash
# Example Nagios integration script
curl -X POST http://localhost:3001/api/components/sync \
  -H "Content-Type: application/json" \
  -d @nagios-status.json
```

### Zabbix Integration

Use Zabbix web scenarios or API to push status updates:

```javascript
// Example Zabbix integration
const axios = require('axios');

async function updateFromZabbix() {
  const response = await axios.get('http://zabbix-server/api/status');
  // Process and send to monitoring dashboard
}
```

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN cd frontend && npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Systemd Service

Create `/etc/systemd/system/infra-monitor.service`:

```ini
[Unit]
Description=Infrastructure Health Monitor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/infra-monitor
ExecStart=/usr/bin/node backend/server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

## Development

### Adding New Component Types

1. Update the monitoring service in `backend/services/monitoringService.js`
2. Add the new check method
3. Update the frontend types in `frontend/src/types/index.ts`

### Custom Themes

Modify the Tailwind configuration in `frontend/tailwind.config.js` to customize colors and styling.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Reinitialize the database
cd backend && npm run init-db
```

**WebSocket Connection Failed**
- Check firewall settings for port 3001
- Verify backend server is running
- Check browser console for connection errors

**High Memory Usage**
- Adjust history retention in database queries
- Consider data archiving for long-term storage

### Logging

Logs are stored in `backend/logs/`:
- `combined.log` - All application logs
- `error.log` - Error logs only

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Built with:** Node.js, Express, React, TypeScript, Socket.io, SQLite, Tailwind CSS 