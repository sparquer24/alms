/**
 * Health Routes
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint with device connectivity
 *     description: Check if the bridge server is running, RDService connectivity, and Mantra device status
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server health with detailed connectivity information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: biometric-bridge
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 rdservice:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     url:
 *                       type: string
 *                     responseTime:
 *                       type: number
 *                 devices:
 *                   type: object
 *                   properties:
 *                     fingerprint:
 *                       type: object
 *                     iris:
 *                       type: object
 *                     photograph:
 *                       type: object
 */
router.get('/health', healthController.getHealth.bind(healthController));

/**
 * @swagger
 * /api/rdservice/status:
 *   get:
 *     summary: Check RDService connectivity
 *     description: Verify if RDService is running and accessible on port 11100
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: RDService status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                   description: Whether RDService is accessible
 *                 rdserviceUrl:
 *                   type: string
 *                   example: http://127.0.0.1:11100
 *                 response:
 *                   type: string
 *                   description: Raw XML response from RDService
 *                 error:
 *                   type: string
 *                   description: Error message if connection failed
 */
router.get('/api/rdservice/status', healthController.getRDServiceStatus.bind(healthController));

module.exports = router;
