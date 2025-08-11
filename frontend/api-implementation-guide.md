# ALMS API Implementation Guide

This guide provides implementation examples and code prompts for developing each API endpoint in the Arms License Management System (ALMS) backend.

## Table of Contents

- [Authentication APIs](#authentication-apis)
- [Application Management APIs](#application-management-apis)
- [Document Management APIs](#document-management-apis)
- [Report APIs](#report-apis)
- [User Management APIs](#user-management-apis)
- [Role-Based Action APIs](#role-based-action-apis)
- [Batch Action APIs](#batch-action-apis)

## Authentication APIs

### Login API

**Endpoint:** `/api/auth/login`  
**Method:** POST

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, AuditLog, RolePermission, RefreshToken } = require('../models');

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate request body
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user in database
    const user = await User.findOne({ where: { username, is_active: true } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Log failed login attempt
      await AuditLog.create({
        action: 'FAILED_LOGIN',
        user_id: user.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token with 1 hour expiry
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    // Generate refresh token with 7 days expiry
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Store refresh token
    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    // Update last login timestamp
    await user.update({ last_login: new Date() });
    
    // Log successful login
    await AuditLog.create({
      action: 'LOGIN',
      user_id: user.id,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    // Get user permissions
    const permissions = await RolePermission.findAll({
      where: { role: user.role },
      attributes: ['permission']
    });
    
    // Return user information and token
    return res.status(200).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        designation: user.designation,
        permissions: permissions.map(p => p.permission)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### Logout API

**Endpoint:** `/api/auth/logout`  
**Method:** POST

```javascript
/**
 * @route POST /api/auth/logout
 * @desc Invalidate user session and blacklist token
 * @access Private
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Get token from authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    // Add token to blacklist with expiry time
    await TokenBlacklist.create({
      token,
      expires_at: req.user.exp * 1000 // Convert to milliseconds
    });
    
    // Remove refresh token
    await RefreshToken.destroy({
      where: { user_id: req.user.userId }
    });
    
    // Log logout action
    await AuditLog.create({
      action: 'LOGOUT',
      user_id: req.user.userId,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Get Current User API

**Endpoint:** `/api/auth/me`  
**Method:** GET

```javascript
/**
 * @route GET /api/auth/me
 * @desc Get authenticated user details
 * @access Private
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.user is populated by the authMiddleware with JWT payload data
    const userId = req.user.userId;
    
    // Fetch user details from database
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'username', 'email', 'role', 'designation', 'created_at', 'last_login']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user permissions based on role
    const permissions = await RolePermission.findAll({
      where: { role: user.role },
      attributes: ['permission']
    });
    
    // Get available actions based on role
    const roleActions = await RoleAction.findAll({
      where: { role: user.role },
      attributes: ['action', 'resource']
    });
    
    // Log access
    await AuditLog.create({
      action: 'PROFILE_ACCESS',
      user_id: userId,
      ip_address: req.ip,
      details: JSON.stringify({
        endpoint: '/api/auth/me',
        method: 'GET'
      })
    });
    
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        designation: user.designation,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        permissions: permissions.map(p => p.permission),
        availableActions: roleActions.map(a => ({
          action: a.action,
          resource: a.resource
        }))
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Application Management APIs

### Get All Applications API

**Endpoint:** `/api/applications`  
**Method:** GET

```javascript
/**
 * @route GET /api/applications
 * @desc Get all applications with filtering and pagination
 * @access Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Extract query parameters
    const {
      status,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;
    
    // Build filters based on user role and query parameters
    const filters = {};
    
    // Role-based access control
    const userRole = req.user.role;
    if (userRole !== 'ADMIN' && userRole !== 'COMMISSIONER_OF_POLICE') {
      if (userRole === 'APPLICANT') {
        // Applicants can only see their own applications
        filters.created_by = req.user.userId;
      } else {
        // Other roles can see applications assigned to them or forwarded by them
        filters[Op.or] = [
          { assigned_to: req.user.userId },
          { forwarded_from: req.user.userId }
        ];
      }
    }
    
    // Add status filter if provided
    if (status) {
      filters.status = status;
    }
    
    // Add date range filter if provided
    if (fromDate && toDate) {
      filters.created_at = {
        [Op.between]: [new Date(fromDate), new Date(toDate)]
      };
    } else if (fromDate) {
      filters.created_at = {
        [Op.gte]: new Date(fromDate)
      };
    } else if (toDate) {
      filters.created_at = {
        [Op.lte]: new Date(toDate)
      };
    }
    
    // Add search filter if provided
    if (search) {
      filters[Op.or] = [
        { applicant_name: { [Op.iLike]: `%${search}%` } },
        { applicant_mobile: { [Op.iLike]: `%${search}%` } },
        { applicant_email: { [Op.iLike]: `%${search}%` } },
        { id: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Query applications with filters and pagination
    const { count, rows } = await Application.findAndCountAll({
      where: filters,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'role', 'designation']
        },
        {
          model: User,
          as: 'forwardedFrom',
          attributes: ['id', 'name', 'role', 'designation']
        },
        {
          model: User,
          as: 'forwardedTo',
          attributes: ['id', 'name', 'role', 'designation']
        }
      ]
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Log the API access
    await AuditLog.create({
      action: 'VIEW_APPLICATIONS',
      user_id: req.user.userId,
      ip_address: req.ip,
      details: JSON.stringify({ filters, page, limit })
    });
    
    // Return paginated results
    return res.status(200).json({
      applications: rows,
      pagination: {
        totalCount: count,
        totalPages,
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Get Application by ID API

**Endpoint:** `/api/applications/{id}`  
**Method:** GET

```javascript
/**
 * @route GET /api/applications/:id
 * @desc Get detailed application information by ID
 * @access Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the application
    const application = await Application.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'role', 'designation']
        },
        {
          model: User,
          as: 'forwardedFrom',
          attributes: ['id', 'name', 'role', 'designation']
        },
        {
          model: User,
          as: 'forwardedTo',
          attributes: ['id', 'name', 'role', 'designation']
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'name', 'type', 'url', 'created_at'],
          include: [
            {
              model: User,
              as: 'uploadedBy',
              attributes: ['id', 'name', 'role']
            }
          ]
        },
        {
          model: ApplicationHistory,
          as: 'history',
          attributes: ['id', 'action', 'comments', 'created_at'],
          include: [
            {
              model: User,
              as: 'performedBy',
              attributes: ['id', 'name', 'role', 'designation']
            }
          ],
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Check user permissions
    const userRole = req.user.role;
    const userIsApplicant = req.user.role === 'APPLICANT';
    const userCreatedApp = application.created_by === req.user.userId;
    const userAssignedToApp = application.assigned_to === req.user.userId;
    
    // Applicants can only view their own applications
    if (userIsApplicant && !userCreatedApp) {
      return res.status(403).json({ error: 'You do not have permission to view this application' });
    }
    
    // Get available actions based on role and application status
    const availableActions = await getAvailableActions(
      req.user.role,
      application.status,
      application
    );
    
    // Log the access
    await AuditLog.create({
      action: 'VIEW_APPLICATION_DETAIL',
      user_id: req.user.userId,
      ip_address: req.ip,
      details: JSON.stringify({
        applicationId: id,
        status: application.status
      })
    });
    
    return res.status(200).json({
      application,
      availableActions
    });
  } catch (error) {
    console.error('Get application by ID error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to determine available actions based on role and status
async function getAvailableActions(role, status, application) {
  const actions = [];
  
  switch (role) {
    case 'APPLICANT':
      if (status === 'RETURNED') {
        actions.push('RESUBMIT');
      }
      actions.push('VIEW');
      break;
    
    case 'ZONAL_SUPERINTENDENT':
      if (status === 'FRESH_FORM' || status === 'FORWARDED' || status === 'RETURNED') {
        actions.push('FORWARD_TO_SHO', 'FORWARD_TO_ACP');
        actions.push('RETURN');
        actions.push('FLAG');
      }
      actions.push('VIEW', 'ADD_DOCUMENT', 'ADD_COMMENT');
      break;
    
    case 'STATION_HOUSE_OFFICER':
      if (status === 'FORWARDED') {
        actions.push('FORWARD_TO_ACP');
        actions.push('RETURN');
        actions.push('FLAG');
      }
      actions.push('VIEW', 'ADD_DOCUMENT', 'ADD_COMMENT');
      break;
      
    // Add cases for other roles...
    
    case 'COMMISSIONER_OF_POLICE':
      actions.push('VIEW', 'APPROVE', 'REJECT', 'RETURN', 'FLAG', 'ADD_COMMENT');
      break;
      
    case 'ADMIN':
      actions.push('VIEW', 'APPROVE', 'REJECT', 'RETURN', 'FLAG', 'ADD_COMMENT', 'DELETE');
      break;
  }
  
  return actions;
}
```

### Create Application API

**Endpoint:** `/api/applications`  
**Method:** POST

```javascript
/**
 * @route POST /api/applications
 * @desc Create a new license application
 * @access Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Start a database transaction
    const transaction = await sequelize.transaction();
    
    try {
      const {
        applicantName,
        applicantMobile,
        applicantEmail,
        fatherName,
        gender,
        dob,
        address,
        applicationType,
        weaponType,
        weaponReason,
        licenseType,
        licenseValidity,
        isPreviouslyHeldLicense,
        previousLicenseNumber,
        hasCriminalRecord,
        criminalRecordDetails,
        documents
      } = req.body;
      
      // Validate required fields
      const requiredFields = ['applicantName', 'applicantMobile', 'applicationType', 'weaponType', 'weaponReason'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          fields: missingFields
        });
      }
      
      // Validate mobile number format
      if (!/^[0-9]{10}$/.test(applicantMobile)) {
        return res.status(400).json({
          error: 'Invalid mobile number format. Must be 10 digits.'
        });
      }
      
      // Validate email format if provided
      if (applicantEmail && !/^\S+@\S+\.\S+$/.test(applicantEmail)) {
        return res.status(400).json({
          error: 'Invalid email format.'
        });
      }
      
      // Generate application ID with prefix and random number
      const currentYear = new Date().getFullYear();
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const applicationId = `ALMS-${currentYear}-${randomNum}`;
      
      // Get initial workflow data
      const initialStatus = 'FRESH_FORM';
      const applicantRole = req.user.role; // Should be 'APPLICANT'
      const nextRole = await getNextRole(applicantRole, initialStatus);
      
      // Create application record
      const application = await Application.create({
        id: applicationId,
        applicant_name: applicantName,
        applicant_mobile: applicantMobile,
        applicant_email: applicantEmail,
        father_name: fatherName,
        gender,
        dob: dob ? new Date(dob) : null,
        address,
        application_type: applicationType,
        weapon_type: weaponType,
        weapon_reason: weaponReason,
        license_type: licenseType,
        license_validity: licenseValidity ? new Date(licenseValidity) : null,
        is_previously_held_license: isPreviouslyHeldLicense || false,
        previous_license_number: previousLicenseNumber,
        has_criminal_record: hasCriminalRecord || false,
        criminal_record_details: criminalRecordDetails,
        status: initialStatus,
        created_by: req.user.userId,
        assigned_to: null // Will be assigned when forwarded
      }, { transaction });
      
      // Create application history record
      await ApplicationHistory.create({
        application_id: applicationId,
        action: 'CREATE',
        performed_by: req.user.userId,
        comments: 'Application created',
        created_at: new Date()
      }, { transaction });
      
      // Process document uploads if provided
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          // Validate document data
          if (!doc.name || !doc.type || !doc.base64Data) {
            continue; // Skip invalid documents
          }
          
          // Generate safe filename
          const fileExt = doc.name.split('.').pop().toLowerCase();
          const allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];
          
          if (!allowedExts.includes(fileExt)) {
            continue; // Skip invalid file types
          }
          
          const safeFileName = `${applicationId}-${doc.type.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.${fileExt}`;
          
          // Get file buffer from base64
          const fileBuffer = Buffer.from(
            doc.base64Data.replace(/^data:.*?;base64,/, ''),
            'base64'
          );
          
          // Upload to cloud storage (implementation depends on your storage provider)
          const fileUrl = await uploadFile(
            fileBuffer,
            safeFileName,
            doc.name,
            fileExt
          );
          
          // Create document record
          await Document.create({
            application_id: applicationId,
            name: doc.name,
            type: doc.type,
            url: fileUrl,
            uploaded_by: req.user.userId,
            created_at: new Date()
          }, { transaction });
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      // Create audit log
      await AuditLog.create({
        action: 'APPLICATION_CREATED',
        user_id: req.user.userId,
        ip_address: req.ip,
        details: JSON.stringify({
          applicationId,
          applicationType,
          weaponType
        })
      });
      
      // Return success response
      return res.status(201).json({
        success: true,
        message: 'Application created successfully',
        applicationId,
        status: initialStatus,
        nextRole
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Create application error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Update Application Status API

**Endpoint:** `/api/applications/{id}/status`  
**Method:** PATCH

```javascript
/**
 * @route PATCH /api/applications/:id/status
 * @desc Update application status
 * @access Private
 */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    
    // Validate request
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Valid status values
    const validStatuses = [
      'FRESH_FORM', 
      'FORWARDED', 
      'RETURNED', 
      'FLAGGED', 
      'APPROVED', 
      'REJECTED', 
      'DISPOSED'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Get application
      const application = await Application.findByPk(id, { transaction });
      
      if (!application) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Application not found' });
      }
      
      // Check if user has permission to update status
      const userRole = req.user.role;
      const canUpdateStatus = await checkStatusUpdatePermission(
        userRole,
        application.status,
        status
      );
      
      if (!canUpdateStatus) {
        await transaction.rollback();
        return res.status(403).json({ 
          error: 'You do not have permission to update the status to ' + status 
        });
      }
      
      // Save old status for history
      const oldStatus = application.status;
      
      // Update application status
      await application.update(
        { 
          status,
          ...(status === 'RETURNED' && { return_reason: comments }),
          ...(status === 'FLAGGED' && { flag_reason: comments }),
          ...(status === 'DISPOSED' && { disposal_reason: comments }),
          updated_at: new Date()
        },
        { transaction }
      );
      
      // Create history record
      await ApplicationHistory.create(
        {
          application_id: id,
          action: `STATUS_CHANGE_${oldStatus}_TO_${status}`,
          performed_by: req.user.userId,
          comments: comments || `Status changed from ${oldStatus} to ${status}`,
          created_at: new Date()
        },
        { transaction }
      );
      
      // If status is APPROVED or REJECTED, create a notification
      if (status === 'APPROVED' || status === 'REJECTED') {
        await Notification.create(
          {
            user_id: application.created_by,
            type: status === 'APPROVED' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
            title: `Application ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
            message: `Your application (${id}) has been ${status === 'APPROVED' ? 'approved' : 'rejected'}${comments ? ': ' + comments : ''}`,
            is_read: false,
            created_at: new Date()
          },
          { transaction }
        );
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Log the status change
      await AuditLog.create({
        action: 'APPLICATION_STATUS_CHANGE',
        user_id: req.user.userId,
        ip_address: req.ip,
        details: JSON.stringify({
          applicationId: id,
          oldStatus,
          newStatus: status,
          comments
        })
      });
      
      return res.status(200).json({
        success: true,
        message: 'Application status updated successfully',
        applicationId: id,
        oldStatus,
        newStatus: status
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Update application status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to check if user has permission to update status
async function checkStatusUpdatePermission(role, currentStatus, newStatus) {
  // Define allowed status transitions per role
  const allowedTransitions = {
    'APPLICANT': {
      'RETURNED': ['FRESH_FORM']
    },
    'ZONAL_SUPERINTENDENT': {
      'FRESH_FORM': ['FORWARDED', 'RETURNED', 'FLAGGED'],
      'FORWARDED': ['RETURNED', 'FLAGGED']
    },
    'STATION_HOUSE_OFFICER': {
      'FORWARDED': ['FORWARDED', 'RETURNED', 'FLAGGED']
    },
    'ASSISTANT_COMMISSIONER': {
      'FORWARDED': ['FORWARDED', 'RETURNED', 'FLAGGED', 'APPROVED', 'REJECTED']
    },
    'DEPUTY_COMMISSIONER': {
      'FORWARDED': ['FORWARDED', 'RETURNED', 'FLAGGED', 'APPROVED', 'REJECTED']
    },
    'COMMISSIONER_OF_POLICE': {
      'FORWARDED': ['APPROVED', 'REJECTED', 'RETURNED', 'FLAGGED'],
      'FLAGGED': ['APPROVED', 'REJECTED', 'RETURNED', 'DISPOSED']
    },
    'ADMIN': {
      // Admin can change to any status
      'FRESH_FORM': ['FORWARDED', 'RETURNED', 'FLAGGED', 'APPROVED', 'REJECTED', 'DISPOSED'],
      'FORWARDED': ['FRESH_FORM', 'RETURNED', 'FLAGGED', 'APPROVED', 'REJECTED', 'DISPOSED'],
      'RETURNED': ['FRESH_FORM', 'FORWARDED', 'FLAGGED', 'APPROVED', 'REJECTED', 'DISPOSED'],
      'FLAGGED': ['FRESH_FORM', 'FORWARDED', 'RETURNED', 'APPROVED', 'REJECTED', 'DISPOSED'],
      'APPROVED': ['FRESH_FORM', 'FORWARDED', 'RETURNED', 'FLAGGED', 'REJECTED', 'DISPOSED'],
      'REJECTED': ['FRESH_FORM', 'FORWARDED', 'RETURNED', 'FLAGGED', 'APPROVED', 'DISPOSED'],
      'DISPOSED': ['FRESH_FORM', 'FORWARDED', 'RETURNED', 'FLAGGED', 'APPROVED', 'REJECTED']
    }
  };
  
  // Check if the role has permissions for the current status
  if (!allowedTransitions[role] || !allowedTransitions[role][currentStatus]) {
    return false;
  }
  
  // Check if the new status is allowed
  return allowedTransitions[role][currentStatus].includes(newStatus);
}
```

### Forward Application API

**Endpoint:** `/api/applications/{id}/forward`  
**Method:** POST

```javascript
/**
 * @route POST /api/applications/:id/forward
 * @desc Forward application to next authority
 * @access Private
 */
router.post('/:id/forward', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { forwardToRole, comments } = req.body;
    
    // Validate request
    if (!forwardToRole) {
      return res.status(400).json({ error: 'Forward to role is required' });
    }
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Get application
      const application = await Application.findByPk(id, { transaction });
      
      if (!application) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Application not found' });
      }
      
      // Check if user has permission to forward application
      const userRole = req.user.role;
      const canForward = await checkForwardPermission(
        userRole,
        forwardToRole,
        application.status
      );
      
      if (!canForward) {
        await transaction.rollback();
        return res.status(403).json({ 
          error: `You do not have permission to forward to ${forwardToRole}` 
        });
      }
      
      // Find a user with the target role to assign the application to
      const targetUser = await User.findOne({
        where: {
          role: forwardToRole,
          is_active: true
        },
        order: [
          ['last_assigned_at', 'ASC'], // Balance workload
          ['id', 'ASC']
        ],
        transaction
      });
      
      if (!targetUser) {
        await transaction.rollback();
        return res.status(400).json({ 
          error: `No active user found with role ${forwardToRole}` 
        });
      }
      
      // Update application
      await application.update(
        {
          status: 'FORWARDED',
          forwarded_from: req.user.userId,
          forwarded_to: targetUser.id,
          assigned_to: targetUser.id,
          forward_comments: comments,
          updated_at: new Date()
        },
        { transaction }
      );
      
      // Update target user's last assigned timestamp
      await targetUser.update(
        { last_assigned_at: new Date() },
        { transaction }
      );
      
      // Create history record
      await ApplicationHistory.create(
        {
          application_id: id,
          action: `FORWARDED_TO_${forwardToRole}`,
          performed_by: req.user.userId,
          comments: comments || `Forwarded to ${targetUser.name} (${forwardToRole})`,
          created_at: new Date()
        },
        { transaction }
      );
      
      // Create notification for the target user
      await Notification.create(
        {
          user_id: targetUser.id,
          type: 'APPLICATION_FORWARDED',
          title: 'Application Forwarded to You',
          message: `Application (${id}) has been forwarded to you by ${req.user.name}${comments ? ': ' + comments : ''}`,
          is_read: false,
          created_at: new Date()
        },
        { transaction }
      );
      
      // Commit transaction
      await transaction.commit();
      
      // Log the forward action
      await AuditLog.create({
        action: 'APPLICATION_FORWARD',
        user_id: req.user.userId,
        ip_address: req.ip,
        details: JSON.stringify({
          applicationId: id,
          forwardedTo: {
            userId: targetUser.id,
            name: targetUser.name,
            role: targetUser.role
          },
          comments
        })
      });
      
      return res.status(200).json({
        success: true,
        message: 'Application forwarded successfully',
        applicationId: id,
        forwardedTo: {
          id: targetUser.id,
          name: targetUser.name,
          role: targetUser.role
        }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Forward application error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to check if user has permission to forward application
async function checkForwardPermission(fromRole, toRole, currentStatus) {
  // Only allow forwarding if status is FRESH_FORM or FORWARDED
  if (currentStatus !== 'FRESH_FORM' && currentStatus !== 'FORWARDED') {
    return false;
  }
  
  // Get role hierarchy from database
  const roleHierarchy = await RoleHierarchy.findOne({
    where: {
      from_role: fromRole,
      to_role: toRole
    }
  });
  
  return !!roleHierarchy;
}
```

## Document Management APIs

### Upload Document API

**Endpoint:** `/api/applications/{id}/documents`  
**Method:** POST

```javascript
/**
 * @route POST /api/applications/:id/documents
 * @desc Upload document for an application
 * @access Private
 */
router.post('/:id/documents', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType, documentName } = req.body;
    
    // Validate request
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }
    
    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }
    
    // Get application
    const application = await Application.findByPk(id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Check user permission
    const userRole = req.user.role;
    const userIsApplicant = userRole === 'APPLICANT';
    const userCreatedApp = application.created_by === req.user.userId;
    const userAssignedToApp = application.assigned_to === req.user.userId;
    
    // Only applicant who created the app or user assigned to it can upload
    if ((userIsApplicant && !userCreatedApp) || (!userIsApplicant && !userAssignedToApp)) {
      return res.status(403).json({ 
        error: 'You do not have permission to upload documents for this application' 
      });
    }
    
    // Validate file type
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];
    
    if (!allowedExts.includes(fileExt)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Allowed types: PDF, JPG, JPEG, PNG' 
      });
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        error: 'File size exceeds the 5MB limit' 
      });
    }
    
    // Generate safe filename
    const safeFileName = `${id}-${documentType.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.${fileExt}`;
    
    // Upload to storage
    const fileUrl = await uploadFile(
      req.file.buffer,
      safeFileName,
      req.file.originalname,
      fileExt
    );
    
    // Create document record
    const document = await Document.create({
      application_id: id,
      name: documentName || req.file.originalname,
      type: documentType,
      url: fileUrl,
      uploaded_by: req.user.userId,
      created_at: new Date()
    });
    
    // Create history record
    await ApplicationHistory.create({
      application_id: id,
      action: 'DOCUMENT_UPLOAD',
      performed_by: req.user.userId,
      comments: `Uploaded document: ${documentType}`,
      created_at: new Date()
    });
    
    // Log the document upload
    await AuditLog.create({
      action: 'DOCUMENT_UPLOAD',
      user_id: req.user.userId,
      ip_address: req.ip,
      details: JSON.stringify({
        applicationId: id,
        documentId: document.id,
        documentType,
        fileName: req.file.originalname,
        fileSize: req.file.size
      })
    });
    
    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        url: document.url,
        createdAt: document.created_at,
        uploadedBy: req.user.userId
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to upload file to storage
async function uploadFile(buffer, fileName, originalName, fileExt) {
  // Implementation depends on your storage provider (AWS S3, Azure Blob, etc.)
  // This is a simple example using local file system
  const storagePath = path.join(process.env.UPLOAD_DIR, fileName);
  
  await fs.promises.writeFile(storagePath, buffer);
  
  // In production, return a URL to the uploaded file
  return `/uploads/${fileName}`;
}
```

### Get Documents API

**Endpoint:** `/api/applications/{id}/documents`  
**Method:** GET

```javascript
/**
 * @route GET /api/applications/:id/documents
 * @desc Get documents for an application
 * @access Private
 */
router.get('/:id/documents', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get application
    const application = await Application.findByPk(id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Check user permission
    const userRole = req.user.role;
    const userIsApplicant = userRole === 'APPLICANT';
    const userCreatedApp = application.created_by === req.user.userId;
    const userAssignedToApp = application.assigned_to === req.user.userId;
    const userForwardedApp = application.forwarded_from === req.user.userId;
    
    // Only applicant who created, user assigned to it, or user who forwarded it can view documents
    if (userIsApplicant && !userCreatedApp) {
      return res.status(403).json({ 
        error: 'You do not have permission to view documents for this application' 
      });
    }
    
    if (!userIsApplicant && !userAssignedToApp && !userForwardedApp && userRole !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'You do not have permission to view documents for this application' 
      });
    }
    
    // Get documents
    const documents = await Document.findAll({
      where: { application_id: id },
      include: [
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Generate secure URLs for documents
    const documentsWithSecureUrls = documents.map(doc => {
      // In a real implementation, generate time-limited signed URLs
      // This is just a placeholder
      const secureUrl = generateSecureUrl(doc.url, 15); // 15 minutes expiry
      
      return {
        id: doc.id,
        name: doc.name,
        type: doc.type,
        url: secureUrl,
        createdAt: doc.created_at,
        uploadedBy: doc.uploadedBy ? {
          id: doc.uploadedBy.id,
          name: doc.uploadedBy.name,
          role: doc.uploadedBy.role
        } : null
      };
    });
    
    // Log the document access
    await AuditLog.create({
      action: 'DOCUMENT_ACCESS',
      user_id: req.user.userId,
      ip_address: req.ip,
      details: JSON.stringify({
        applicationId: id,
        documentCount: documents.length
      })
    });
    
    return res.status(200).json({
      success: true,
      applicationId: id,
      documents: documentsWithSecureUrls
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate secure URLs
function generateSecureUrl(url, expiryMinutes) {
  // Implementation depends on your storage provider
  // This is a simple example that adds a token to the URL
  const expiryTime = Date.now() + expiryMinutes * 60 * 1000;
  const token = crypto
    .createHash('sha256')
    .update(`${url}:${process.env.URL_SECRET}:${expiryTime}`)
    .digest('hex');
  
  return `${url}?token=${token}&expires=${expiryTime}`;
}
```

## Report APIs

### Generate Application PDF API

**Endpoint:** `/api/applications/{id}/pdf`  
**Method:** GET

```javascript
/**
 * @route GET /api/applications/:id/pdf
 * @desc Generate PDF for an application
 * @access Private
 */
router.get('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get application with all related data
    const application = await Application.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'role', 'designation']
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'name', 'type', 'url', 'created_at']
        },
        {
          model: ApplicationHistory,
          as: 'history',
          attributes: ['id', 'action', 'comments', 'created_at'],
          include: [
            {
              model: User,
              as: 'performedBy',
              attributes: ['id', 'name', 'role', 'designation']
            }
          ],
          order: [['created_at', 'ASC']]
        }
      ]
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Check user permission
    const userRole = req.user.role;
    const userIsApplicant = userRole === 'APPLICANT';
    const userCreatedApp = application.created_by === req.user.userId;
    const userAssignedToApp = application.assigned_to === req.user.userId;
    
    // Applicants can only access their own applications
    if (userIsApplicant && !userCreatedApp) {
      return res.status(403).json({ 
        error: 'You do not have permission to generate PDF for this application' 
      });
    }
    
    // Generate PDF using a library like PDFKit or html-pdf
    const pdfBuffer = await generateApplicationPDF(application);
    
    // Log the PDF generation
    await AuditLog.create({
      action: 'PDF_GENERATION',
      user_id: req.user.userId,
      ip_address: req.ip,
      details: JSON.stringify({
        applicationId: id,
        generatedAt: new Date()
      })
    });
    
    // Set response headers and send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=application-${id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate PDF
async function generateApplicationPDF(application) {
  // This is a placeholder for PDF generation logic
  // You would use a library like PDFKit, html-pdf, or puppeteer
  
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();
  
  // Create a buffer to store PDF
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  
  // Add content to PDF
  doc.fontSize(20).text('Arms License Application', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12).text(`Application ID: ${application.id}`);
  doc.text(`Status: ${application.status}`);
  doc.text(`Created: ${application.created_at}`);
  doc.moveDown();
  
  doc.fontSize(16).text('Applicant Information');
  doc.fontSize(12).text(`Name: ${application.applicant_name}`);
  doc.text(`Mobile: ${application.applicant_mobile}`);
  doc.text(`Email: ${application.applicant_email || 'Not provided'}`);
  doc.text(`Father's Name: ${application.father_name || 'Not provided'}`);
  doc.text(`Gender: ${application.gender || 'Not provided'}`);
  doc.text(`Date of Birth: ${application.dob ? application.dob.toDateString() : 'Not provided'}`);
  doc.text(`Address: ${application.address || 'Not provided'}`);
  doc.moveDown();
  
  doc.fontSize(16).text('License Information');
  doc.fontSize(12).text(`Application Type: ${application.application_type}`);
  doc.text(`Weapon Type: ${application.weapon_type}`);
  doc.text(`Weapon Reason: ${application.weapon_reason}`);
  doc.text(`License Type: ${application.license_type || 'Standard'}`);
  doc.moveDown();
  
  if (application.has_criminal_record) {
    doc.fontSize(16).text('Criminal Record');
    doc.fontSize(12).text(`Details: ${application.criminal_record_details || 'Not provided'}`);
    doc.moveDown();
  }
  
  if (application.documents && application.documents.length > 0) {
    doc.fontSize(16).text('Uploaded Documents');
    application.documents.forEach(doc => {
      doc.fontSize(12).text(`${doc.type}: ${doc.name} (Uploaded on ${doc.created_at.toDateString()})`);
    });
    doc.moveDown();
  }
  
  if (application.history && application.history.length > 0) {
    doc.fontSize(16).text('Application History');
    application.history.forEach(historyItem => {
      const performedBy = historyItem.performedBy 
        ? `${historyItem.performedBy.name} (${historyItem.performedBy.role})`
        : 'System';
        
      doc.fontSize(12).text(`${historyItem.created_at.toDateString()}: ${historyItem.action}`);
      doc.fontSize(10).text(`By: ${performedBy}`);
      
      if (historyItem.comments) {
        doc.fontSize(10).text(`Comments: ${historyItem.comments}`);
      }
      
      doc.moveDown(0.5);
    });
  }
  
  // Finalize the PDF
  doc.end();
  
  // Return a promise that resolves with the PDF buffer
  return new Promise(resolve => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
}
```

## Other APIs

Implementing the remaining APIs follows a similar pattern. For each API:

1. Define the route with proper parameters and HTTP method
2. Add authentication and authorization checks
3. Validate inputs
4. Perform database operations (preferably inside transactions for data consistency)
5. Create audit logs
6. Return appropriate responses

For database models, implement proper relationships, indexes, and constraints as defined in your schema to ensure data integrity and performance.

## API Security Best Practices

1. **Input Validation**
   - Validate all request parameters and body data
   - Use validation libraries or middleware for consistency
   - Sanitize inputs to prevent SQL injection and XSS

2. **Authentication & Authorization**
   - Implement proper JWT handling with token expiration
   - Use secure token storage practices
   - Implement role-based access control for all endpoints
   - Add rate limiting to prevent brute force attacks

3. **Error Handling**
   - Never expose sensitive details in error responses
   - Use standardized error response format
   - Log errors securely without sensitive data

4. **Data Protection**
   - Encrypt sensitive data in transit and at rest
   - Use signed URLs for document access
   - Implement proper file type and size validation

5. **Logging & Monitoring**
   - Log all important operations for audit trails
   - Monitor API usage and error patterns
   - Set up alerts for suspicious activities
