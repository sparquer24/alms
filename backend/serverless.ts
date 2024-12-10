import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'my-serverless-project',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline'], // Add serverless-offline here
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'ap-south-1',
    timeout: 10,
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
  },
  functions: {
    hello: {
      handler: 'src/functions/hello/handler.main',
      events: [
        {
          http: {
            path: 'hello',
            method: 'get',
            request: {
              parameters: {
                querystrings: {
                  name: true, // This makes the 'name' query parameter required
                  age: false, // This makes the 'age' query parameter optional
                },
              },
            },
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
          },
        },
      ],
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node20',
      platform: 'node',
    }, 'serverless-offline': {
      httpPort: 3001, // Custom port for HTTP
      lambdaPort: 3002, // Custom port for Lambda invocations
      host: 'localhost', // Bind to a specific host
      noPrependStageInUrl: true, // Disable prepending the stage name to the URL
      useChildProcesses: true, // Run each function in its own child process
    },
  },
};

module.exports = serverlessConfiguration;
