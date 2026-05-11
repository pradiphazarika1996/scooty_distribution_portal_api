import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import Document from "../../../models/masters/Document.model";

export default {
  addDocument: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await Document.create(req.body).catch((err) => {
        throw httpError.InternalServerError(err);
      });
      if (!data) throw httpError.InternalServerError();

      res.status(200).send({
        status: true,
      });
    } catch (err: any) {
      console.log(err);
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },
  updateDocument: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documentId = req.params.id;
      const [updatedRows] = await Document.update(req.body, {
        where: { id: documentId },
      }).catch((err) => {
        throw httpError.InternalServerError();
      });
      if (!updatedRows) throw httpError.InternalServerError();

      res.status(200).send({ status: true });
    } catch (err: any) {
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },
  deleteDocument: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documentId = req.params.id;
      const data = await Document.destroy({
        where: { id: documentId },
      }).catch((err) => {
        throw httpError.InternalServerError();
      });
      if (!data) throw httpError.InternalServerError();

      res.status(200).send({ status: true });
    } catch (err: any) {
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },

  getDocument: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documentId = req.params.id;
      let data = await Document.findOne({
        where: { id: documentId },
        attributes: [
          "id",
          "name",
          "code",
          "file_type",
          "is_mandatory",
          "is_active",
        ],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });
      res.status(200).send({ status: true, data });
    } catch (err: any) {
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },

  getDocuments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documents = await Document.findAll({
        attributes: [
          "id",
          "name",
          "code",
          "file_type",
          "is_mandatory",
          "is_active",
        ],
        order: [["id", "DESC"]],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });

      res.status(200).send({ status: true, data: documents });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
};
