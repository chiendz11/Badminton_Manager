// services/accountService.js
import Admin from "../models/admin.js";
import bcrypt from "bcrypt";

export const findAdminById = (id) => Admin.findById(id).select("-password");

export const updateAdmin = async (id, updates) => {
  if (updates.password) {
    const salt = await bcrypt.genSalt(10);
    updates.password = await bcrypt.hash(updates.password, salt);
  }
  return await Admin.findByIdAndUpdate(id, updates, { new: true }).select("-password");
};
