import * as centerService from "../services/centerService.js";

// Lấy danh sách tất cả các nhà thi đấu
export const getCenters = async (req, res) => {
  try {
    const centers = await centerService.findAll();
    res.json(centers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin 1 nhà thi đấu theo id
export const getCenterById = async (req, res) => {
  try {
    const center = await centerService.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }
    res.json(center);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo mới 1 nhà thi đấu
export const createCenter = async (req, res) => {
  try {
    const center = await centerService.create(req.body);
    res.status(201).json(center);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật thông tin 1 nhà thi đấu theo id
export const updateCenter = async (req, res) => {
  try {
    const center = await centerService.update(req.params.id, req.body);
    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }
    res.json(center);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa nhà thi đấu theo id
export const deleteCenter = async (req, res) => {
  try {
    const center = await centerService.remove(req.params.id);
    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }
    res.json({ message: "Center deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
