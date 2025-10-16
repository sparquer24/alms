/**
 * Biometric Bridge Server
 * Entry point for the application
 */

const app = require('./app');
const config = require('./src/config/config');

const PORT = config.server.port;
const HOST = config.server.host;
const RDSERVICE_URL = config.rdservice.url;
const FRONTEND_URL = config.server.frontendUrl;

// ============================================
// START SERVER
// ============================================

app.listen(PORT, HOST, () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Biometric Bridge Server Started                   ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Bridge URL:     http://localhost:${PORT}                   ║`);
  console.log(`║  API Docs:       http://localhost:${PORT}/api-docs          ║`);
  console.log(`║  RDService URL:  ${RDSERVICE_URL}                ║`);
  console.log(`║  Frontend URL:   ${FRONTEND_URL}             ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  Endpoints:                                                ║');
  console.log('║    GET  /health                                            ║');
  console.log('║    GET  /api/rdservice/status                              ║');
  console.log('║    GET  /api/captureFingerprint                            ║');
  console.log('║    GET  /api/captureIris                                   ║');
  console.log('║    GET  /api/capturePhotograph                             ║');
  console.log('║    GET  /api/deviceInfo                                    ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  📚 View full API documentation at /api-docs               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
