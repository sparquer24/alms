import type { AWS } from '@serverless/typescript';

let corsHeaders = {
  integration: 'lambda', // Direct integration with Lambda
  cors: {
    origin: '*', // Allow all origins; replace with specific domain if needed
    headers: [
      'Content-Type',
      'Authorization',
      'X-Amz-Date',
      'X-Api-Key',
      'X-Amz-Security-Token',
      'X-Amz-User-Agent',
      'Authorization',
    ],
  },
};

const serverlessConfiguration: AWS = {
  service: 'my-serverless-project',
  frameworkVersion: '3',
  plugins: ['serverless-offline', 'serverless-plugin-typescript', 'serverless-dotenv-plugin'], // Plugins
  
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'ap-south-1',
    stage: 'dev',
    timeout: 10,    
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      CLIENT_ID: "7usr9q8uc06io6d9eaug9m7p1o",
      USER_POOL_ID: "ap-south-1_bFOQKZMWS",
    },
  },
  functions: {
    // User Management
    getUsers: {
      handler: 'src/handlers/user.getUsers',
      events: [
        {
          http: {
            path: 'api/users',
            method: 'get',
            ...corsHeaders
          },
        },
      ],
    },
    // Authentication
    login: {
      handler: 'src/handlers/auth.login',
      events: [
        {
          http: {
            path: 'api/auth/login',
            method: 'post',
            ...corsHeaders
          },
        },
      ],
    },
    logout: {
      handler: 'src/handlers/auth.logout',
      events: [
        {
          http: {
            path: 'api/auth/logout',
            method: 'post',
            ...corsHeaders
          },
        },
      ],
    },
    getMe: {
      handler: 'src/handlers/auth.getMe',
      events: [
        {
          http: {
            path: 'api/auth/me',
            method: 'get',
            ...corsHeaders
          },
        },
      ],
    },
    // Application Management
    getApplications: {
      handler: 'src/handlers/application.getApplications',
      events: [
        {
          http: {
            path: 'api/applications',
            method: 'get',
            ...corsHeaders
          },
        },
      ],
    },
    getApplicationById: {
      handler: 'src/handlers/application.getApplicationById',
      events: [
        {
          http: {
            path: 'api/applications/{id}',
            method: 'get',
            ...corsHeaders
          },
        },
      ],
    },
    createApplication: {
      handler: 'src/handlers/application.createApplication',
      events: [
        {
          http: {
            path: 'api/applications',
            method: 'post',
            ...corsHeaders
          },
        },
      ],
    },
    updateApplicationStatus: {
      handler: 'src/handlers/application.updateApplicationStatus',
      events: [
        {
          http: {
            path: 'api/applications/{id}/status',
            method: 'patch',
            ...corsHeaders
          },
        },
      ],
    },
    forwardApplication: {
      handler: 'src/handlers/application.forwardApplication',
      events: [
        {
          http: {
            path: 'api/applications/{id}/forward',
            method: 'post',
            ...corsHeaders
          },
        },
      ],
    },
    batchProcessApplications: {
      handler: 'src/handlers/application.batchProcessApplications',
      events: [
        {
          http: {
            path: 'api/applications/batch',
            method: 'post',
            ...corsHeaders
          },
        },
      ],
    },
    // Document Management
    uploadDocument: {
      handler: 'src/handlers/document.uploadDocument',
      events: [
        {
          http: {
            path: 'api/applications/{id}/documents',
            method: 'post',
            ...corsHeaders
          },
        },
      ],
    },
    getDocuments: {
      handler: 'src/handlers/document.getDocuments',
      events: [
        {
          http: {
            path: 'api/applications/{id}/documents',
            method: 'get',
            ...corsHeaders
          },
        },
      ],
    },
    deleteDocument: {
      handler: 'src/handlers/document.deleteDocument',
      events: [
        {
          http: {
            path: 'api/applications/{id}/documents/{documentId}',
            method: 'delete',
            ...corsHeaders
          },
        },
      ],
    },
    // Report APIs
    getStatistics: {
      handler: 'src/handlers/report.getStatistics',
      events: [
        {
          http: {
            path: 'api/reports/statistics',
            method: 'get',
            ...corsHeaders
          },
        },
      ],
    },
    getApplicationsByStatus: {
      handler: 'src/handlers/report.getApplicationsByStatus',
      events: [
        {
          http: {
            path: 'api/reports/applications-by-status',
            method: 'get',
            ...corsHeaders
          },
        },
      ],
    },
    generateApplicationPDF: {
      handler: 'src/handlers/report.generateApplicationPDF',
      events: [
        {
          http: {
            path: 'api/applications/{id}/pdf',
            method: 'get',
            ...corsHeaders
          },
        },
      ],
    },
    // Role APIs
    getRoleActions: {
      handler: 'src/handlers/role.getRoleActions',
      events: [
        {
          http: {
            path: 'api/roles/actions',
            method: 'get',
            ...corsHeaders
          },
        },
      ],
    },
    getRoleHierarchy: {
      handler: 'src/handlers/role.getRoleHierarchy',
      events: [
        {
          http: {
            path: 'api/roles/hierarchy',
            method: 'get',
            ...corsHeaders
          },
        },
      ],
    },
  },  custom: {
    'serverless-offline': {
      httpPort: 3001, // Custom port for HTTP
      lambdaPort: 3002, // Custom port for Lambda invocations
      host: 'localhost', // Bind to a specific host
      noPrependStageInUrl: true, // Disable prepending the stage name to the URL
      useChildProcesses: true, // Run each function in its child process
    },
    dotenv: {
      path: './.env',
      include: ['CLIENT_ID', 'USER_POOL_ID', 'JWT_SECRET'],
    },
  },
};

// @ts-ignore
module.exports = serverlessConfiguration;