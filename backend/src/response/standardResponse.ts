import { CustomError } from '../utils/CustomError';
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    "Access-Control-Allow-Credentials": true
};

export const standardResponse = {
    success: (data: any, responseCode = 'SUCCESS', statusCode = 200) => ({
        statusCode,
        isSuccess: statusCode === 200,
        headers,
        body: JSON.stringify({
            statusCode,
            responseCode,
            data,
            error: { error: '', errorDescription: '' },
        }),
    }),

    error: (message: string, statusCode = 500, responseCode = 'ERROR') => {
        const error = new CustomError(message, statusCode);
        return {
            statusCode: error.statusCode, // Use the statusCode from CustomError
            isSuccess: false,
            headers,
            body: JSON.stringify({
                statusCode,
                responseCode,
                data: null,
                error: {
                    message: error.message,
                    ...(error.body && { details: error.body }),
                },
            }),
        };
    },

    badRequest: (message: string, responseCode = 'BAD_REQUEST') => ({
        statusCode: 400,
        isSuccess: false,
        headers,
        body: JSON.stringify({
            statusCode: 400,
            responseCode,
            data: null,
            error: {
                message,
                errorDescription: 'Bad request',
            },
        }),
    }),

    noContent: (responseCode = 'NO_CONTENT') => ({
        statusCode: 204,
        isSuccess: true,
        headers,
        body: JSON.stringify({
            statusCode: 204,
            responseCode,
            data: null,
            error: { error: '', errorDescription: '' },
        }),
    }),

    unauthorized: (message: string, responseCode = 'UNAUTHORIZED') => ({
        statusCode: 401,
        isSuccess: false,
        headers,
        body: JSON.stringify({
            statusCode: 401,
            responseCode,
            data: null,
            error: {
                message,
                errorDescription: 'Unauthorized access',
            },
        }),
    }),

    created: (data: any, responseCode = 'CREATED') => ({
        statusCode: 201,
        isSuccess: true,
        headers,
        body: JSON.stringify({
            statusCode: 201,
            responseCode,
            data,
            error: { error: '', errorDescription: '' },
        }),
    }),
};
