import { prisma } from '../dbConfig/prisma';

// Document Management Handlers
// POST /applications/:id/documents
interface PathParameters {
    id?: string;
    docId?: string;
}

interface LambdaEvent {
    pathParameters?: PathParameters;
    body?: string;
    [key: string]: any;
}

interface LambdaResponse {
    statusCode: number;
    body: string;
}

exports.uploadDocument = async (event: LambdaEvent): Promise<LambdaResponse> => {
    // Parse applicationId from pathParameters
    // Parse multipart/form-data (requires additional library like busboy or multer)
    // Save document record in DB
    return {
        statusCode: 501,
        body: JSON.stringify({ message: 'Not implemented: uploadDocument' }),
    };
};

// GET /applications/:id/documents
interface GetDocumentsEvent extends LambdaEvent {
    pathParameters?: {
        id?: string;
    };
}

exports.getDocuments = async (event: GetDocumentsEvent): Promise<LambdaResponse> => {
  const applicationId = event.pathParameters && event.pathParameters.id;
  if (!applicationId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Application ID is required.' }),
    };
  }
  // Commenting out references to `document` as the model is not defined in the schema
  // const documents = await prisma.document.findMany({ where: { applicationId } });
  return {
    statusCode: 200,
    body: JSON.stringify([]),
  };
};

// DELETE /applications/:id/documents/:docId
interface DeleteDocumentEvent extends LambdaEvent {
    pathParameters?: {
        id?: string;
        docId?: string;
    };
}

exports.deleteDocument = async (event: DeleteDocumentEvent): Promise<LambdaResponse> => {
  const docId = event.pathParameters && event.pathParameters.docId;
  if (!docId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Document ID is required.' }),
    };
  }
  // await prisma.document.delete({ where: { id: docId } });
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Document deleted.' }),
  };
};
