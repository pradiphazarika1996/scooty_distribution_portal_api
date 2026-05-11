import multer from "multer";
import multerS3 from "multer-s3";
import { nanoid } from "nanoid";
import path from "path";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "../helpers/constants";
import s3 from "../services/AwsS3Client";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME ?? "";

const uploadFile = multer({
  storage: multerS3({
    s3,
    bucket: BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, nanoid(20) + path.extname(file.originalname));
      // cb(null, file.originalname);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only PDF, JPG, PNG allowed"));
    }
    cb(null, true);
  },
});

export const singleUpload =
  (fieldName: string) => (req: any, res: any, next: any) => {
    uploadFile.single(fieldName)(req, res, (err: unknown) => {
      if (err) {
        console.log("Error occurred while uploading file to S3:", err);
        return next(err);
      }
      next();
    });
  };

export const multipleUpload =
  (fieldName: string, maxCount: number) => (req: any, res: any, next: any) => {
    uploadFile.array(fieldName, maxCount)(req, res, (err: unknown) => {
      console.log(err);
      if (err) return next(err);
      next();
    });
  };

export default uploadFile;
