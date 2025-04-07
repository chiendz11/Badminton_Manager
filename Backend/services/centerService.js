import Center from "../models/centers.js";

// Lấy tất cả các nhà thi đấu
export const findAll = async () => {
  return await Center.find({});
};

// Tìm kiếm 1 nhà thi đấu theo id
export const findById = async (id) => {
  return await Center.findById(id);
};

// Tạo mới 1 nhà thi đấu
export const create = async (centerData) => {
  const center = new Center(centerData);
  return await center.save();
};

// Cập nhật thông tin nhà thi đấu theo id
export const update = async (id, centerData) => {
  return await Center.findByIdAndUpdate(id, centerData, { new: true });
};

// Xóa nhà thi đấu theo id
export const remove = async (id) => {
  return await Center.findByIdAndDelete(id);
};
