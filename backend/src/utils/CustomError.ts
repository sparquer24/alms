// src/utils/CustomError.ts

export class CustomError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);

        // Set the prototype explicitly to ensure instanceOf works
        Object.setPrototypeOf(this, new.target.prototype);

        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this);
    }
}
