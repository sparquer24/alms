// src/functions/hello/handler.ts
import type { APIGatewayProxyHandler } from 'aws-lambda';
import { CustomError } from '../../utils/CustomError';

export const main: APIGatewayProxyHandler = async (event:any) => {
  try {
    const name = event.query.name;
    console.log(name);

    if (!name) {
      throw new CustomError('Name parameter is required', 400);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Hello, ${name}!` }),
    };
  } catch (error) {
    console.error('Handler error:', error);
    throw error;
  }
};
