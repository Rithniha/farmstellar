import mongoose from "mongoose";

const CropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  plantedAt: { type: Date, default: Date.now },
  notes: String,
});

const Crop = mongoose.models.Crop || mongoose.model("Crop", CropSchema);

export default Crop;
