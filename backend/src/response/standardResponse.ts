import { CustomError } from '../utils/CustomError';
const Headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    "Access-Control-Allow-Credentials": true
};

export const standardResponse = {
    success: (data: any, responseCode = 'SUCCESS') => ({
        statusCode: 200,
        isSuccess: true,
        Headers,
        body: JSON.stringify({
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
            Headers,
            body: JSON.stringify({
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
        Headers,
        body: JSON.stringify({
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
        Headers,
        body: JSON.stringify({
            responseCode,
            data: null,
            error: { error: '', errorDescription: '' },
        }),
    }),

    unauthorized: (message: string, responseCode = 'UNAUTHORIZED') => ({
        statusCode: 401,
        isSuccess: false,
        Headers,
        body: JSON.stringify({
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
        Headers,
        body: JSON.stringify({
            responseCode,
            data,
            error: { error: '', errorDescription: '' },
        }),
    }),
};
