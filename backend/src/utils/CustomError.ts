import { APIGatewayProxyResult } from "aws-lambda";

export class CustomError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly body?: any;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true,
        body?: any
    ) {
        super(message);

        // Set the prototype explicitly to ensure instanceOf works
        Object.setPrototypeOf(this, new.target.prototype);

        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.body = body;

        Error.captureStackTrace(this);
    }

    toAPIGatewayProxyResult() {
        return {
            statusCode: this.statusCode, // Ensure the correct status code is returned
            body: JSON.stringify({
                isSuccess: false,
                message: this.message,
                ...(this.body && { details: this.body }),
            }),
        };
    }
    
}
