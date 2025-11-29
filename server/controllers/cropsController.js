import Crop from "../models/crop.js";

export async function getCrops(req, res, next) {
  try {
    const crops = await Crop.find().lean();
    res.json(crops);
  } catch (err) {
    next(err);
  }
}

export async function createCrop(req, res, next) {
  try {
    // Basic validation: require a non-empty `name` field
    const { name, plantedAt, notes } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Field `name` is required" });
    }

    const crop = new Crop({ name: name.trim(), plantedAt, notes });
    await crop.save();
    res.status(201).json(crop);
  } catch (err) {
    next(err);
  }
}
