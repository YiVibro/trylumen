// lambdas/orchestrator.js
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
// Use a light dependency like pdf-lib to check pages without downloading the whole text
const { PDFDocument } = require('pdf-lib'); 

const s3 = new S3Client({ region: process.env.AWS_REGION });
const lambda = new LambdaClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  // 1. Capture the file metadata straight from the S3 drop event
  const bucket = event.Records[0].s3.bucket.name;
  const s3Key = event.Records[0].s3.object.key;
  
  // Extract custom user metadata attached during presigned post generation
  const headParams = new HeadObjectCommand({ Bucket: bucket, Key: s3Key });
  const metadata = await s3.send(headParams);
  const documentId = metadata.Metadata['document-id']; // Sent from your DB row
  const userId = metadata.Metadata['userid'];

  // 2. Fetch page indices using a streaming buffer
  // (In a full production scale, you read only the structural trailer bytes of the PDF)
  
  const CHUNK_SIZE = 20; // 👈 Say, 20 pages per worker instance
  const totalPages = 100; // Let's assume 100 pages for example structure
  
  // 3. Fan-Out Invocation Loop (TCP style parallel distribution)
  const invocations = [];
  let chunkIndex = 0;

  for (let startPage = 1; startPage <= totalPages; startPage += CHUNK_SIZE) {
    const endPage = Math.min(startPage + CHUNK_SIZE - 1, totalPages);
    
    const payload = {
      documentId, s3Key, bucket, userId,
      startPage, endPage, chunkIndex
    };

    // Trigger the Worker Lambda asynchronously (Event invocation type = non-blocking)
    const invokeCommand = new InvokeCommand({
      FunctionName: 'Lumen-Doc-Worker-Production',
      InvocationType: 'Event', 
      Payload: Buffer.from(JSON.stringify(payload))
    });

    invocations.push(lambda.send(invokeCommand));
    chunkIndex++;
  }

  await Promise.all(invocations); // Direct parallel launch completed!
  return { status: "Fanned-out successfully" };
};