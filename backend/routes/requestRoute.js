import express from "express";
import { createRequest, getRequests, updateRequest } from "../controller/requestController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:itemId", auth, createRequest);
router.get("/", auth, getRequests);
router.put("/:id", auth, updateRequest);

export default router;
