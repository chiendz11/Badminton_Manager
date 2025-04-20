// controllers/accountController.js
import Admin from "../models/admin.js";
import bcrypt from "bcrypt";

// Giả định bạn có middleware để gán req.adminId
export const getCurrentAdmin = async (req, res) => {
  try {
    const adminId = req.adminId; // lấy từ middleware xác thực
    const admin = await Admin.findById(adminId).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdminAccount = async (req, res) => {
  try {
    const { username, password, avatar } = req.body;
    const updates = { username, avatar };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(req.adminId, updates, {
      new: true,
    }).select("-password");

    res.json(updatedAdmin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
