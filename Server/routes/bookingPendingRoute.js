import express from "express";
import { togglePendingTimeslot, getPendingMapping } from "../controllers/bookingPendingController.js";
const router = express.Router();

router.post("/toggle", async (req, res) => {
  try {
    const { userId, centerId, date, courtId, timeslot } = req.body;
    const booking = await togglePendingTimeslot(userId, centerId, date, courtId, timeslot);
    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error toggling pending timeslot:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/mapping", async (req, res) => {
  try {
    const { centerId, date } = req.query;
    const mapping = await getPendingMapping(centerId, date);
    res.json({ success: true, mapping });
  } catch (error) {
    console.error("Error fetching pending mapping:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
