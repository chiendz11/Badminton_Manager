import {
  getCourtsByCenter,
  getTimeslotPrice,
  getCenterDetailById,
  getAllCenters
} from "../services/centerServices.js";

export const getCourtsByCenterController = async (req, res) => {
  try {
    const { centerId } = req.query;
    const courts = await getCourtsByCenter(centerId);
    res.status(200).json({
      success: true,
      data: courts,
    });
  } catch (error) {
    console.error("Error in getCourtsByCenterController:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTimeslotPriceController = async (req, res) => {
  try {
    const { centerId, date, timeslot } = req.body;
    const price = await getTimeslotPrice(centerId, date, timeslot);
    res.json({ success: true, price });
  } catch (error) {
    console.error("Error in getTimeslotPriceController:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getCenterPricingByIdController = async (req, res) => {
  try {
    const { centerId } = req.query;
    if (!centerId) {
      return res.status(400).json({ success: false, error: "Missing centerId" });
    }
    const center = await getCenterDetailById(centerId);
    if (!center.pricing) {
      return res.status(500).json({ success: false, error: "Pricing data not available" });
    }
    return res.json({ success: true, pricing: center.pricing });
  } catch (error) {
    console.error("Error in getCenterPricingController:", error);
    if (error.message === "Center not found") {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getCenterInfoByIdController = async (req, res) => {
  try {
    const { centerId } = req.query;
    if (!centerId) {
      return res.status(400).json({ success: false, error: "Missing centerId" });
    }
    const center = await getCenterDetailById(centerId);
    if (!center) {
      return res.status(404).json({ success: false, error: "Center not found" });
    }
    return res.json({ success: true, data: center });
  } catch (error) {
    console.error("Error in getCenterInfoByIdController:", error);
    if (error.message === "Center not found") {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllCentersController = async (req, res) => {
  try {
    const centers = await getAllCenters();
    res.status(200).json({ success: true, data: centers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};