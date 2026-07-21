import { NextFunction, Request, Response } from "express";
import {
  APPLICATION_STATUS,
  generateApplicationNumber,
} from "../../helpers/students/application";
import Student from "../../models/student/Student.model";
export const getApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.status(200).json({
      status: true,
      application: student,
    });
  } catch (error: any) {
    console.error("getApplication error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to get application",
    });
  }
};

export const submitApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const existingNumber = student.getDataValue("application_number");
    if (existingNumber) {
      return res
        .status(409)
        .json({ message: "Already have existing application" });
    }
    const application_number = generateApplicationNumber(studentId);
    console.log("application", application_number);

    await student.update({
      ...req.body,
      application_number: application_number,
      application_status: APPLICATION_STATUS.SUBMITTED,
      submitted_at: new Date(),
    });

    return res.json({
      message: "Application submitted successfully",
      application: student,
    });
  } catch (error: any) {
    console.log("error here", error);
    const status = error.status ?? 500;
    const message = "Failed to submit application";
    return res.status(status).send({ status: false, message });
  }
};
