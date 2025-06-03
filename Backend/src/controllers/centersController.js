import {
  getCourtsByCenter,
  getTimeslotPrice,
  getCenterDetailById,
  getAllCenters,
} from '../services/centerServices.js'; // Sửa đường dẫn từ courtService.js thành centerServices.js

export const getCourtsByCenterController = async (req, res) => {
  try {
    const { centerId } = req.query;
    if (!centerId) {
      return res.status(400).json({ success: false, error: 'Thiếu ID trung tâm' });
    }
    const courts = await getCourtsByCenter(centerId);
    res.status(200).json({ success: true, data: courts });
  } catch (error) {
    console.error('Lỗi trong getCourtsByCenterController:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

export const getTimeslotPriceController = async (req, res) => {
  try {
    const { centerId, date, timeslot } = req.body;
    if (!centerId || !date || timeslot === undefined) {
      return res.status(400).json({ success: false, error: 'Thiếu các trường bắt buộc' });
    }
    const price = await getTimeslotPrice(centerId, date, timeslot);
    res.status(200).json({ success: true, price });
  } catch (error) {
    console.error('Lỗi trong getTimeslotPriceController:', error.message);
    if (error.message === 'Center not found') {
      return res.status(400).json({ success: false, error: 'Center not found' });
    }
    if (error.message === 'Không tìm thấy khung giá cho timeslot này') {
      return res.status(400).json({ success: false, error: 'Timeslot không hợp lệ' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getCenterPricingByIdController = async (req, res) => {
  try {
    const { centerId } = req.query;
    if (!centerId) {
      return res.status(400).json({ success: false, error: 'Thiếu ID trung tâm' });
    }
    const center = await getCenterDetailById(centerId);
    res.status(200).json({ success: true, pricing: center.pricing });
  } catch (error) {
    console.error('Lỗi trong getCenterPricingByIdController:', error.message);
    if (error.message === 'Center not found' || error.message === 'Thiếu centerId') {
      return res.status(400).json({ success: false, error: 'Center not found' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getCenterInfoByIdController = async (req, res) => {
  try {
    const { centerId } = req.query;
    if (!centerId) {
      return res.status(400).json({ success: false, error: 'Thiếu ID trung tâm' });
    }
    const center = await getCenterDetailById(centerId);
    res.status(200).json({ success: false, data: center });
  } catch (error) {
    console.error('Lỗi trong getCenterInfoByIdController:', error.message);
    if (error.message === 'Center not found' || error.message === 'Thiếu centerId') {
      return res.status(404).json({ success: false, error: 'Center not found' });
    }
    res.status(404).json({ success: false, error: error.message });
  }
};

export const getAllCentersController = async (req, res) => {
  try {
    const centers = await getAllCenters();
    res.status(200).json({ success: true, data: centers });
  } catch (error) {
    console.error('Lỗi trong getAllCentersController:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};