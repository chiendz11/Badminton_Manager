import accountService from '../services/accountService.js';

// Lấy thông tin tài khoản Admin theo id
export const getAdminAccount = async (req, res) => {
  try {
    const adminId = req.params.id;
    const admin = await accountService.getAdminById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin tài khoản Admin
export const updateAdminAccount = async (req, res) => {
  try {
    const adminId = req.params.id;
    const updatedAdmin = await accountService.updateAdminAccount(adminId, req.body);
    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(200).json({ message: 'Account updated successfully', admin: updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
