import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUserDetails } from "../services/getMe";
import { verifyToken } from "../cognito/verifyToken";
import { standardResponse } from "../response/standardResponse";

export const getMeHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
      // Extract token from Authorization header
      const authHeader = event.headers?.Authorization || event.headers?.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return  standardResponse.unauthorized("Unauthorized: No token provided");
      }

      const token = authHeader.split(" ")[1]; // Get token after "Bearer"

      // Verify the token and get decoded user data
      const decodedToken = await verifyToken(token);

      // Fetch user details from the service using the decoded user ID
      if (!decodedToken.sub) {
        throw new Error("Invalid token: Missing user ID");
      }
      const userDetails = await getUserDetails(decodedToken.sub);

      return standardResponse.success(userDetails);
  } catch (error:any) {
      return standardResponse.error(error.message);
  }
};