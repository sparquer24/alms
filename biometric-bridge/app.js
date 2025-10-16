/**
 * Express Application Setup
 */

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const config = require('./src/config/config');
const swaggerSpecs = require('./swagger');

// Middleware
const logger = require('./src/middleware/logger.middleware');
const errorHandler = require('./src/middleware/errorHandler.middleware');

// Routes
const healthRoutes = require('./src/routes/health.routes');
const biometricRoutes = require('./src/routes/biometric.routes');

const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

app.use(express.json());

// CORS Configuration
app.use(cors({
  origin: config.cors.origins,
  methods: config.cors.methods,
  credentials: config.cors.credentials
}));

// Logging
app.use(logger);

// ============================================
// ROUTES
// ============================================

// Health and Status Routes
app.use('/', healthRoutes);

// Biometric Routes
app.use('/', biometricRoutes);

// Root redirect to API docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// ============================================
// SWAGGER DOCUMENTATION
// ============================================

if (config.swagger.enabled) {
  app.use(config.swagger.path, swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Biometric Bridge API Docs',
  }));
}

// ============================================
// ERROR HANDLER
// ============================================

app.use(errorHandler);

module.exports = app;
