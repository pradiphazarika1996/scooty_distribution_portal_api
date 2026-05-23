import axios from "axios";
import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import Contact from "../../models/landing/contact.model";

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

async function verifyRecaptcha(token: string): Promise<boolean> {
  const response = await axios.post(RECAPTCHA_VERIFY_URL, null, {
    params: {
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: token,
    },
  });
  return response.data.success === true;
}

export default {
  submitContact: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fullName, phone, email, message, recaptchaToken } = req.body;

      if (!fullName || !phone || !message || !recaptchaToken) {
        throw httpError.BadRequest(
          "Full name, phone, message, and reCAPTCHA are required.",
        );
      }

      const isHuman = await verifyRecaptcha(recaptchaToken);
      if (!isHuman) {
        throw httpError.BadRequest("reCAPTCHA verification failed.");
      }

      await Contact.create({
        full_name: fullName,
        phone,
        email: email || null,
        message,
      }).catch(() => {
        throw httpError.InternalServerError();
      });

      res
        .status(201)
        .send({ status: true, message: "Message submitted successfully." });
    } catch (err: any) {
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },
  getContacts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contacts = await Contact.findAll({
        attributes: ["id", "full_name", "phone", "email", "message", "created_at"],
        order: [["created_at", "DESC"]],
      }).catch(() => {
        throw httpError.InternalServerError();
      });
      res.status(200).send({ status: true, data: contacts });
    } catch (err: any) {
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }

  }
};
