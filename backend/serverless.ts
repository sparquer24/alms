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
  frameworkVersion: '4',
  plugins: ['serverless-offline'], // Add serverless-offline here
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'ap-south-1',
    timeout: 10,
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      CLIENT_ID: "7usr9q8uc06io6d9eaug9m7p1o",
      USER_POOL_ID: "ap-south-1_bFOQKZMWS",
    },
    httpApi: {
      cors: {
        allowedOrigins: ['*'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        allowedMethods: ['OPTIONS', 'POST'],
      },
    },
  },
  functions: {
    loginHandler: {
      handler: 'src/handlers/users.loginHandler',
      events: [
        {
          http: {
            path: 'login',
            method: 'post',
            ...corsHeaders,
            integration: "lambda-proxy",
          },
        },
      ],
    },
    // logout
    logoutHandler: {
      handler: 'src/handlers/users.logoutHandler',
      events: [
        {
          http: {
            path: 'logout',
            method: 'post',
          ...corsHeaders
          },
        },
      ],
    },
    getMeHandler: {
      handler: 'src/handlers/getMe.getMeHandler',
      events: [
        {
          http: {
            path: 'UserDetails',
            method: 'get',
            ...corsHeaders,
          },
        },
      ],
    },
  },
  custom: {
    'serverless-offline': {
      httpPort: 3001, // Custom port for HTTP
      lambdaPort: 3002, // Custom port for Lambda invocations
      host: 'localhost', // Bind to a specific host
      noPrependStageInUrl: true, // Disable prepending the stage name to the URL
      useChildProcesses: true, // Run each function in its child process
    },
  },
};

module.exports = serverlessConfiguration;
