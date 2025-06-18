import * as jwt from 'jsonwebtoken';
import { APIGatewayProxyEvent } from 'aws-lambda';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export function authenticate(event: APIGatewayProxyEvent) {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
