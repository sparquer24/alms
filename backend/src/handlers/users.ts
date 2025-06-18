import { APIGatewayProxyHandler } from 'aws-lambda';

export const getUsers: APIGatewayProxyHandler = async (event) => {
  // Dummy data
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];

  return {
    statusCode: 200,
    body: JSON.stringify(users),
  };
};