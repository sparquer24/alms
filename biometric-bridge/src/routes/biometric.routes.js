/**
 * Biometric Routes
 */

const express = require('express');
const router = express.Router();
const biometricController = require('../controllers/biometric.controller');

/**
 * @swagger
 * /api/captureFingerprint:
 *   get:
 *     summary: Capture fingerprint/thumb impression
 *     description: Initiates fingerprint capture using connected biometric device
 *     tags:
 *       - Capture
 *     parameters:
 *       - in: query
 *         name: timeout
 *         schema:
 *           type: integer
 *           default: 10000
 *         description: Capture timeout in milliseconds
 *     responses:
 *       200:
 *         description: Capture result (success or failure)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 errorCode:
 *                   type: integer
 *                 errorMessage:
 *                   type: string
 *                 qScore:
 *                   type: integer
 *                   description: Quality score 0-100
 *                 type:
 *                   type: string
 *                   example: fingerprint
 *                 templates:
 *                   type: object
 *                   nullable: true
 *                 deviceInfo:
 *                   type: object
 *                   nullable: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: RDService not running
 *       408:
 *         description: Capture timeout
 */
router.get('/api/captureFingerprint', biometricController.captureFingerprint.bind(biometricController));

/**
 * @swagger
 * /api/captureFingerprint:
 *   post:
 *     summary: Capture fingerprint/thumb impression (POST)
 *     description: Initiates fingerprint capture using connected biometric device
 *     tags:
 *       - Capture
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeout:
 *                 type: integer
 *                 default: 10000
 *     responses:
 *       200:
 *         description: Capture result
 */
router.post('/api/captureFingerprint', biometricController.captureFingerprint.bind(biometricController));

/**
 * @swagger
 * /api/captureIris:
 *   get:
 *     summary: Capture iris scan
 *     description: Initiates iris scan capture for both eyes using connected biometric device
 *     tags:
 *       - Capture
 *     parameters:
 *       - in: query
 *         name: timeout
 *         schema:
 *           type: integer
 *           default: 15000
 *         description: Capture timeout in milliseconds
 *     responses:
 *       200:
 *         description: Capture result (success or failure)
 *       503:
 *         description: RDService not running
 *       408:
 *         description: Capture timeout
 */
router.get('/api/captureIris', biometricController.captureIris.bind(biometricController));

/**
 * @swagger
 * /api/captureIris:
 *   post:
 *     summary: Capture iris scan (POST)
 *     description: Initiates iris scan capture for both eyes
 *     tags:
 *       - Capture
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeout:
 *                 type: integer
 *                 default: 15000
 *     responses:
 *       200:
 *         description: Capture result
 */
router.post('/api/captureIris', biometricController.captureIris.bind(biometricController));

/**
 * @swagger
 * /api/capturePhotograph:
 *   get:
 *     summary: Capture photograph
 *     description: Initiates photograph/face capture using connected camera device
 *     tags:
 *       - Capture
 *     parameters:
 *       - in: query
 *         name: timeout
 *         schema:
 *           type: integer
 *           default: 10000
 *         description: Capture timeout in milliseconds
 *     responses:
 *       200:
 *         description: Capture result (success or failure)
 *       503:
 *         description: RDService not running
 *       408:
 *         description: Capture timeout
 */
router.get('/api/capturePhotograph', biometricController.capturePhotograph.bind(biometricController));

/**
 * @swagger
 * /api/capturePhotograph:
 *   post:
 *     summary: Capture photograph (POST)
 *     description: Initiates photograph/face capture
 *     tags:
 *       - Capture
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeout:
 *                 type: integer
 *                 default: 10000
 *     responses:
 *       200:
 *         description: Capture result
 */
router.post('/api/capturePhotograph', biometricController.capturePhotograph.bind(biometricController));

/**
 * @swagger
 * /api/deviceInfo:
 *   get:
 *     summary: Get device information
 *     description: Retrieves information about connected biometric devices from RDService
 *     tags:
 *       - Device
 *     responses:
 *       200:
 *         description: Device information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Parsed device information from RDService
 *       500:
 *         description: Failed to retrieve device information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */
router.get('/api/deviceInfo', biometricController.getDeviceInfo.bind(biometricController));

module.exports = router;
