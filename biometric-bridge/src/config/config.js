/**
 * Configuration settings for Biometric Bridge Server
 */

module.exports = {
  // Server Configuration
  server: {
    port: process.env.BRIDGE_PORT || 3030,
    host: '127.0.0.1',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
  },

  // RDService Configuration
  rdservice: {
    fingerprint: {
      url: process.env.RDSERVICE_FINGERPRINT_URL || 'https://127.0.0.1:11101',
      timeout: 10000
    },
    iris: {
      url: process.env.RDSERVICE_IRIS_URL || 'https://127.0.0.1:11102', // MIS100V2 on different port
      timeout: 15000
    },
    photograph: {
      url: process.env.RDSERVICE_PHOTO_URL || 'https://127.0.0.1:11103',
      timeout: 10000
    },
    // Legacy support - defaults to fingerprint
    url: process.env.RDSERVICE_URL || 'https://127.0.0.1:11101',
    timeout: 10000
  },

  // CORS Configuration
  cors: {
    origins: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },

  // Capture Configuration
  capture: {
    defaults: {
      fingerprint: {
        fCount: '1',
        fType: '0', // FMR (as per Mantra device)
        iCount: '0',
        pCount: '0',
        timeout: '10000',
        pTimeout: '20000',
        pgCount: '2'
      },
      iris: {
        fCount: '0',
        fType: '0',
        iCount: '2', // Both eyes
        pCount: '0',
        timeout: '15000',
        pTimeout: '20000',
        pgCount: '2'
      },
      photograph: {
        fCount: '0',
        fType: '0',
        iCount: '0',
        pCount: '1', // Face photo
        timeout: '10000',
        pTimeout: '20000',
        pgCount: '2'
      }
    }
  },

  // Swagger Configuration
  swagger: {
    enabled: true,
    path: '/api-docs',
    title: 'Biometric Bridge API',
    version: '1.0.0',
    description: 'API documentation for Biometric Bridge Server'
  }
};
