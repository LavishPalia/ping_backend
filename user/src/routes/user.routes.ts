import express from "express";
import {
  getAllUsers,
  getUser,
  login,
  myProfile,
  updateName,
  verifyUser,
} from "../controllers/user.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/login", login);
router.post("/verify", verifyUser);

router.get("/me", isAuth, myProfile);
router.get("/all", isAuth, getAllUsers);
router.put("/update", isAuth, updateName);
router.get("/user/:id", getUser);

export default router;
