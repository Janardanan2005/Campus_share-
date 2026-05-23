import Item from "../models/items.js";
import Request from "../models/request.js";

export const createItem = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const category = req.body.category?.trim();
    const imageUrl = req.body.imageUrl || "";
    const phoneNumber = req.body.phoneNumber?.trim() || "";
    const price = Number(req.body.price) || 0;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const item = new Item({
      title,
      description,
      category: category || "General",
      imageUrl,
      price,
      phoneNumber,
      owner: req.user,
    });
    await item.save();
    await item.populate("owner", "name email collegeId year");
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Could not create item", error: error.message });
  }
};

export const getItems = async (req, res) => {
  try {
    const items = await Item.find({ available: true })
      .sort({ createdAt: -1 })
      .populate("owner", "name email collegeId year");
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch items", error: error.message });
  }
};

export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate("owner", "name email collegeId year");

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch item", error: error.message });
  }
};

export const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user })
      .sort({ createdAt: -1 })
      .populate("owner", "name email collegeId year");

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch your posts", error: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (String(item.owner) !== req.user) {
      return res.status(403).json({ message: "Not authorized to update this item" });
    }

    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const category = req.body.category?.trim();
    const imageUrl = req.body.imageUrl || "";
    const phoneNumber = req.body.phoneNumber?.trim() || "";
    const price = Number(req.body.price) || 0;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    item.title = title;
    item.description = description;
    item.category = category || "General";
    item.imageUrl = imageUrl;
    item.price = price;
    item.phoneNumber = phoneNumber;

    await item.save();
    await item.populate("owner", "name email collegeId year");

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Could not update item", error: error.message });
  }
};

export const markItemSold = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (String(item.owner) !== req.user) {
      return res.status(403).json({ message: "Not authorized to update this item" });
    }

    item.available = false;
    await item.save();

    await Request.updateMany(
      { item: item._id, status: "pending" },
      { status: "rejected" }
    );

    res.json({
      message: "Item marked as sold",
      updatedItemId: item._id,
      title: item.title,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not mark item as sold", error: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (String(item.owner) !== req.user) {
      return res.status(403).json({ message: "Not authorized to delete this item" });
    }

    await Request.deleteMany({ item: item._id });
    await item.deleteOne();

    res.json({
      message: "Item deleted successfully",
      deletedItemId: item._id,
      title: item.title,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not delete item", error: error.message });
  }
};
