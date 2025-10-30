/**
 * Swagger API Documentation Configuration
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Biometric Bridge Server API',
      version: '1.0.0',
      description: 'Local bridge server for RDService biometric device communication',
    },
    servers: [
      {
        url: 'http://localhost:3030',
        description: 'Local Bridge Server'
      },
      {
        url: 'http://127.0.0.1:3030',
        description: 'Local Bridge Server (127.0.0.1)'
      }
    ],
  },
  apis: ['./src/routes/*.js'] // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
