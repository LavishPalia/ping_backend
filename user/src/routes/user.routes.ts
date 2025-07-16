import express from "express";
import { login, verifyUser } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/verify", verifyUser);

export default router;
