// src/controllers/courtController.js
import {
  getCourtsByCenter,
  getCourtStatus,
  getTimeslotPrice,
  getCenterDetail
} from "../services/centerServices.js";

/**
 * Controller để lấy danh sách sân theo centerId.
 */
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

/**
 * Controller để lấy trạng thái booking cho các sân theo centerId và date.
 */
export const getCourtStatusController = async (req, res) => {
  try {
    const { centerId, date } = req.query;
    if (!centerId || !date) {
      return res.status(400).json({ error: "centerId and date are required" });
    }
    const statusMapping = await getCourtStatus(centerId, date);
    res.json(statusMapping);
  } catch (error) {
    console.error("Error in getCourtStatusController:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Controller để lấy giá cho một timeslot.
 */
export const getTimeslotPriceController = async (req, res) => {
  try {
    const { centerId, date, timeslot } = req.body;
    const price = await getTimeslotPrice(centerId, date, timeslot);
    res.json({ success: true, price });
  } catch (error) {
    console.error("Error in getTimeslotPriceController:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCenterPricingController = async (req, res) => {
  try {
    const { centerId } = req.query;
    if (!centerId) {
      return res.status(400).json({ success: false, error: "Missing centerId" });
    }
    const center = await getCenterDetail(centerId);
    if (!center.pricing) {
      return res.status(500).json({ success: false, error: "Pricing data not available" });
    }
    return res.json({ success: true, pricing: center.pricing });
  } catch (error) {
    console.error("Error in getCenterPricingController:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
