import Request from "../models/request.js";
import Item from "../models/items.js";

export const createRequest = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (!item.available) {
      return res.status(400).json({ message: "Item is no longer available" });
    }

    if (String(item.owner) === req.user) {
      return res.status(400).json({ message: "You cannot request your own item" });
    }

    const existingRequest = await Request.findOne({
      item: item._id,
      borrower: req.user,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(409).json({ message: "You already requested this item" });
    }

    const request = new Request({
      item: item._id,
      borrower: req.user,
      owner: item.owner,
    });

    await request.save();
    await request.populate("item borrower owner");
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: "Could not create request", error: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const incoming = await Request.find({ owner: req.user })
      .populate("item")
      .populate("borrower", "name email collegeId year")
      .sort({ createdAt: -1 });

    const outgoing = await Request.find({ borrower: req.user })
      .populate("item")
      .populate("owner", "name email collegeId year")
      .sort({ createdAt: -1 });

    res.json({ incoming, outgoing });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch requests", error: error.message });
  }
};

export const updateRequest = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid request status" });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(request.owner) !== req.user) {
      return res.status(403).json({ message: "Not authorized to update this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "This request has already been processed" });
    }

    request.status = status;

    if (status === "accepted") {
      await Item.findByIdAndUpdate(request.item, { available: false });
    }

    await request.save();
    await request.populate("item borrower owner");
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Could not update request", error: error.message });
  }
};
