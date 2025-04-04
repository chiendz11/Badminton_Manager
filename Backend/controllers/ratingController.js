import { getCommentsForCenterService } from "../services/ratingServices.js";

export const getCommentsForCenter = async (req, res) => {
  try {
    const { centerId } = req.query;
    const reviews = await getCommentsForCenterService(centerId);
    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};
