import User from "../models/users.js";

export const getAllUsers = async () => {
  return await User.find({});
};

export const getUserById = async (userId) => {
  return await User.findById(userId);
};

export const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

export const updateUser = async (userId, userData) => {
  return await User.findByIdAndUpdate(userId, userData, { 
    new: true,
    runValidators: true 
  });
};

export const deleteUser = async (userId) => {
  return await User.findByIdAndDelete(userId);
};

export const getUsersByRole = async (role) => {
  return await User.find({ role });
};