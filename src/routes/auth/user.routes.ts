import express from "express";
import AdminUserController from "../../controllers/admin/users/AdminUserController";
import jwt from "../../middleware/jwt";

const router = express.Router();

router.post("/", AdminUserController.addUser)
router.get("/", AdminUserController.getUsers);
router.get("/:id", AdminUserController.getUser);
router.put("/:id", AdminUserController.updateUser);
router.delete("/:id", AdminUserController.deleteUser);
export default router;
