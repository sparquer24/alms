# User Preferences API Implementation Guide

This document provides guidance for implementing the user preferences API endpoints for the Arms License Management System (ALMS).

## Overview

The user preferences API allows users to customize their experience within the ALMS application. These preferences include notification settings, display preferences, and application behavior customizations.

## API Endpoints

### 1. Get User Preferences

**Endpoint**: `GET /api/users/preferences`

**Authentication Required**: Yes (JWT token)

**Description**: Retrieves the current preferences for the authenticated user.

**Response Example**:
```json
{
  "success": true,
  "data": {
    "notifications": {
      "enabled": true,
      "applicationStatusChanges": true,
      "applicationForwarded": true,
      "applicationReturned": true,
      "commentNotifications": true,
      "systemAlerts": true,
      "emailNotifications": true
    },
    "display": {
      "darkMode": false,
      "compactView": false,
      "language": "english"
    },
    "application": {
      "autoSave": true
    }
  }
}
```

### 2. Update User Preferences

**Endpoint**: `PATCH /api/users/preferences`

**Authentication Required**: Yes (JWT token)

**Description**: Updates one or more user preference settings.

**Request Body Example**:
```json
{
  "notifications": {
    "enabled": false,
    "applicationStatusChanges": true
  },
  "display": {
    "darkMode": true
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "User preferences updated successfully"
}
```

## Database Schema

User preferences should be stored in a separate table to keep the users table clean:

```sql
CREATE TABLE user_preferences (
  user_id VARCHAR(36) NOT NULL PRIMARY KEY,
  preferences JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

The preferences JSON field should contain all user preference data structured as in the API responses.

## Default Preferences

When a user is created, a default set of preferences should be created:

```json
{
  "notifications": {
    "enabled": true,
    "applicationStatusChanges": true,
    "applicationForwarded": true,
    "applicationReturned": true,
    "commentNotifications": true,
    "systemAlerts": true,
    "emailNotifications": true
  },
  "display": {
    "darkMode": false,
    "compactView": false,
    "language": "english"
  },
  "application": {
    "autoSave": true
  }
}
```

## Implementation Details

### 1. Get User Preferences Implementation

```javascript
// Example implementation using Node.js and Express
router.get('/api/users/preferences', authenticate, async (req, res) => {
  try {
    // Get user ID from JWT token
    const userId = req.user.id;
    
    // Fetch user preferences from database
    const userPreferences = await db.query(
      'SELECT preferences FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    
    if (userPreferences.length === 0) {
      // If no preferences exist, create default preferences
      const defaultPreferences = getDefaultPreferences();
      await db.query(
        'INSERT INTO user_preferences (user_id, preferences) VALUES (?, ?)',
        [userId, JSON.stringify(defaultPreferences)]
      );
      
      return res.json({
        success: true,
        data: defaultPreferences
      });
    }
    
    // Return existing preferences
    return res.json({
      success: true,
      data: JSON.parse(userPreferences[0].preferences)
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch user preferences',
        code: 'FETCH_PREFERENCES_ERROR'
      }
    });
  }
});
```

### 2. Update User Preferences Implementation

```javascript
// Example implementation using Node.js and Express
router.patch('/api/users/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    // Validate updates
    const validationError = validatePreferenceUpdates(updates);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          message: validationError,
          code: 'INVALID_PREFERENCE_FORMAT'
        }
      });
    }
    
    // Get current preferences
    const currentPreferences = await db.query(
      'SELECT preferences FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    
    let updatedPreferences;
    
    if (currentPreferences.length === 0) {
      // If no preferences exist, create with provided updates and default values
      const defaultPreferences = getDefaultPreferences();
      updatedPreferences = deepMerge(defaultPreferences, updates);
      
      await db.query(
        'INSERT INTO user_preferences (user_id, preferences) VALUES (?, ?)',
        [userId, JSON.stringify(updatedPreferences)]
      );
    } else {
      // Merge existing preferences with updates
      const existingPreferences = JSON.parse(currentPreferences[0].preferences);
      updatedPreferences = deepMerge(existingPreferences, updates);
      
      await db.query(
        'UPDATE user_preferences SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [JSON.stringify(updatedPreferences), userId]
      );
    }
    
    return res.json({
      success: true,
      message: 'User preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update user preferences',
        code: 'UPDATE_PREFERENCES_ERROR'
      }
    });
  }
});

// Helper function to validate preference updates
function validatePreferenceUpdates(updates) {
  const allowedTopLevelKeys = ['notifications', 'display', 'application'];
  const invalidKeys = Object.keys(updates).filter(key => !allowedTopLevelKeys.includes(key));
  
  if (invalidKeys.length > 0) {
    return `Invalid preference categories: ${invalidKeys.join(', ')}`;
  }
  
  // Additional validation logic could be added here
  
  return null;
}

// Helper function for deep merging objects
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}
```

## Event-driven Updates

To enhance the user experience, consider implementing WebSocket notifications for preference changes:

1. When preferences are updated, emit an event to the user's WebSocket connection
2. Frontend can then update its state without requiring a refresh

```javascript
// Example code after updating preferences
const io = req.app.get('socketio');
if (io) {
  const userSocketId = getUserSocketId(userId);
  if (userSocketId) {
    io.to(userSocketId).emit('preferences_updated', updatedPreferences);
  }
}
```

## Security Considerations

1. Always use authentication middleware to ensure only the logged-in user can access or update their own preferences
2. Validate all incoming preference updates against allowed schema to prevent injection attacks
3. Store preferences as JSON to allow for flexible schema evolution without database migrations
4. Implement rate limiting for preference update endpoints to prevent abuse

## Performance Optimization

To enhance performance for frequently accessed preferences:

1. Cache user preferences using Redis or a similar in-memory cache
2. Invalidate cache when preferences are updated
3. Include ETags for HTTP caching on the preference GET endpoint
4. Consider batching preference updates if they're happening frequently

## Testing

Ensure thorough testing of preference APIs:

1. Test setting new preferences for a user without existing preferences
2. Test updating existing preferences (partial and complete updates)
3. Test invalid updates and validation errors
4. Test handling of malformed JSON payloads
5. Test concurrent updates to ensure data consistency
