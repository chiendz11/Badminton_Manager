import axiosInstance from "../config/axiosConfig";

// Lấy danh sách tất cả bill
export const getAllBills = async () => {
  try {
    const response = await axiosInstance.get("/api/admin/bill-manage/get-all-bills");
    if (!response.data || !response.data.success) {
      throw new Error(response.data.message || "Lỗi khi lấy danh sách bill");
    }
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || "Lỗi khi lấy danh sách bill");
  }
};

// Cập nhật trạng thái bill
export const updateBillStatus = async (billId, status) => {
  try {
    const response = await axiosInstance.patch("/api/admin/bill-manage/update-bill-status", {
      billId,
      status
    });
    if (!response.data || !response.data.success) {
      throw new Error(response.data.message || "Lỗi khi cập nhật trạng thái bill");
    }
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || "Lỗi khi cập nhật trạng thái bill");
  }
};

// Tìm kiếm người dùng dựa trên username, phoneNumber, hoặc email
export const searchUsers = async (query) => {
  try {
    const response = await axiosInstance.get("/api/admin/bill-manage/search-users", {
      params: { query }
    });
    if (!response.data || !response.data.success) {
      throw new Error(response.data.message || "Lỗi khi tìm kiếm người dùng");
    }
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || "Lỗi khi tìm kiếm người dùng");
  }
};

// Lấy danh sách tất cả trung tâm
export const getAllCenters = async () => {
  try {
    const response = await axiosInstance.get("/api/admin/bill-manage/get-centers");
    if (!response.data || !response.data.success) {
      throw new Error(response.data.message || "Lỗi khi lấy danh sách trung tâm");
    }
    return response.data.data;
  } catch (error) {
    throw new Error(error.message || "Lỗi khi lấy danh sách trung tâm");
  }
};