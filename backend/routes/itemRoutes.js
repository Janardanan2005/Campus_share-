import express from "express";
import {
  createItem,
  deleteItem,
  getItemById,
  getItems,
  getMyItems,
  markItemSold,
  updateItem,
} from "../controller/itemController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", auth, createItem);
router.get("/", getItems);
router.get("/mine", auth, getMyItems);
router.get("/:id", getItemById);
router.put("/:id", auth, updateItem);
router.put("/:id/sold", auth, markItemSold);
router.delete("/:id", auth, deleteItem);

export default router;
