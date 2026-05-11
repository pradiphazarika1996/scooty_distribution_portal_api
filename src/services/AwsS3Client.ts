import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
const REGION = process.env.AWS_BUCKET_REGION || "";
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY || "";
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_KEY || "";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export const deleteS3File = async (filename: string) => {
  try {
    await s3.send(
      new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: filename }),
    );
  } catch (err: any) {}
};

export default s3;
