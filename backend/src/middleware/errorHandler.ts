// src/middleware/errorHandler.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CustomError } from '../utils/CustomError';

export const errorHandler = async (
    event: APIGatewayProxyEvent,
    context: any,
    next: () => Promise<APIGatewayProxyResult>
): Promise<APIGatewayProxyResult> => {
    try {
        return await next();
    } catch (error) {
        if (error instanceof CustomError) {
            return {
                statusCode: error.statusCode,
                body: JSON.stringify({
                    error: error.message,
                    statusCode: error.statusCode,
                }),
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal Server Error',
                statusCode: 500,
            }),
        };
    }
};
