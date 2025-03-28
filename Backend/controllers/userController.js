// Ví dụ: src/controllers/userController.js
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';

// Hàm kiểm tra email với Hunter.io API
const checkEmailExists = async (email) => {
  const apiKey = "b70f4eb3ad5581c2dafeffb3a8583b75fe275225";
  const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`;
  try {
    const response = await axios.get(url);
    const data = response.data.data;
    // Nếu status là "invalid", "disposable" hoặc "block", trả về lỗi
    if (data.status === "invalid") {
      return { success: false, message: "Email không hợp lệ hoặc không tồn tại!" };
    }
    if (data.disposable) {
      return { success: false, message: "Email này là email tạm thời (disposable)!" };
    }
    if (data.block) {
      return { success: false, message: "Email bị chặn hoặc thuộc danh sách đen!" };
    }
    // Nếu score thấp (ví dụ dưới 50), coi là không đáng tin cậy
    if (data.score < 50) {
      return { success: false, message: "Email không tồn tại hoặc không đáng tin cậy!" };
    }
    return {
      success: true,
      message: `Email hợp lệ! (Độ tin cậy: ${data.score}%)`
    };
  } catch (error) {
    console.error("❌ Lỗi kiểm tra email:", error.response?.data || error.message);
    return { success: false, message: "Lỗi hệ thống khi kiểm tra email!" };
  }
};

// Đăng ký user
export const registerUser = async (req, res) => {
  console.log("📩 Dữ liệu từ frontend:", req.body);
  try {
    const { name, email, phone_number, address, username, password, avatar_image_path } = req.body;
    const errors = {};

    // 1. Kiểm tra dữ liệu đầu vào
    if (!name || !name.trim()) {
      errors.name = "Vui lòng nhập Họ và tên";
    }
    if (!email || !email.trim()) {
      errors.email = "Vui lòng nhập Email";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Email không hợp lệ";
    }
    if (!phone_number || !phone_number.trim()) {
      errors.phone_number = "Vui lòng nhập Số điện thoại";
    }
    if (!address || !address.trim()) {
      errors.address = "Vui lòng nhập Địa chỉ";
    }
    if (!username || !username.trim()) {
      errors.username = "Vui lòng nhập Tên đăng nhập";
    }
    if (!password) {
      errors.password = "Vui lòng nhập Mật khẩu";
    }
    if (password && password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự!";
    }

    // Nếu có lỗi từ dữ liệu đầu vào, chúng ta không cần kiểm tra tiếp
    // Tuy nhiên, nếu bạn muốn kiểm tra đồng thời tất cả lỗi, bạn có thể tiếp tục
    // Nhưng hãy cẩn trọng vì gọi API Hunter.io có thể mất thời gian.
    
    // 2. Kiểm tra email với Hunter.io API
    const emailCheckResult = await checkEmailExists(email);
    if (!emailCheckResult.success) {
      // Ghi đè lỗi email nếu đã có lỗi từ bước 1 hoặc thêm mới nếu chưa có
      errors.email = emailCheckResult.message;
    }

    // 3. Kiểm tra sự tồn tại của email, số điện thoại và username
    const [emailExists, phoneExists, usernameExists] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ phone_number }),
      User.findOne({ username })
    ]);

    if (emailExists) {
      errors.email = "Email đã được sử dụng!";
    }
    if (phoneExists) {
      errors.phone_number = "Số điện thoại đã được sử dụng!";
    }
    if (usernameExists) {
      errors.username = "Tên đăng nhập đã được sử dụng!";
    }

    // Nếu có bất kỳ lỗi nào, trả về đồng thời
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // 4. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Tạo user mới
    const user = await User.create({
      name,
      email,
      phone_number,
      address,
      username,
      password_hash: hashedPassword,
      avatar_image_path: avatar_image_path || ""
    });

    // 6. Trả về thông tin user & token
    return res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      address: user.address,
      username: user.username,
      avatar_image_path: user.avatar_image_path,
      registration_date: user.registration_date,
      token: generateToken(user.id),
      message: "Đăng ký thành công!"
    });
  } catch (error) {
    console.error("❌ Lỗi server khi đăng ký:", error);
    return res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau!" });
  }
};


export const getUserById = async (req, res) => {
    const { userId } = req.query; // Lấy userId từ query parameter
    try {
        const user = await User.findById(userId); // Truy vấn vào database
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Trả về các trường cần thiết
        res.json({ name: user.name, phone: user.phone_number });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Hàm tạo token với payload chứa id và role
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};
  
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ username và password!" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại!" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Sai username hoặc password!" });
    }
    const token = generateToken(user);
    console.log("Token generated:", token);
    // Set token vào cookie HTTP‑only
    res.cookie("token", token, {
      httpOnly: false, // cho dev để xem cookie qua document.cookie
      secure: false,   // không bắt buộc HTTPS khi phát triển
      sameSite: "Lax", // Lax cho phép gửi cookie qua link chuyển hướng, Strict thì hạn chế hơn
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
    });
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        username: user.username,
        avatar_image_path: user.avatar_image_path,
        registration_date: user.registration_date,
        role: user.role,
      },
      message: "Đăng nhập thành công!"
    });
  } catch (error) {
    console.error("Lỗi server khi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau!" });
  }
};

export const getUserInfoController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error("Error in getUserInfoController:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// src/controllers/userController.js
export const logoutController = (req, res) => {
  try {
    // Xóa cookie "token" đã được set khi đăng nhập
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.status(200).json({ success: true, message: "Đăng xuất thành công!" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
