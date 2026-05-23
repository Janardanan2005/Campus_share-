import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  email: { type: String, unique: true, trim: true, lowercase: true, required: true },
  password: { type: String, required: true },
  collegeId: { type: String, trim: true, default: "" },
  year: { type: String, trim: true, default: "" }
});

export default mongoose.model("User", userSchema);
