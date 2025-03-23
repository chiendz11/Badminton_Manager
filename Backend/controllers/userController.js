import User from "../models/Users.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

// Kiểm tra email với Hunter.io API
const checkEmailExists = async (email) => {
    const apiKey = "b70f4eb3ad5581c2dafeffb3a8583b75fe275225";
    const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data.data;

        if (data.status === "invalid") {
            return { success: false, message: "Email không hợp lệ hoặc không tồn tại!" };
        }
        if (data.disposable) {
            return { success: false, message: "Email này là email tạm thời (disposable)!" };
        }
        if (data.block) {
            return { success: false, message: "Email bị chặn hoặc thuộc danh sách đen!" };
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

// Tạo JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Đăng ký user
export const registerUser = async (req, res) => {
    console.log("📩 Dữ liệu từ frontend:", req.body);
    try {
        const { name, email, phone_number, address, username, password, avatar_image_path } = req.body;

        // 🛑 1️⃣ Kiểm tra dữ liệu đầu vào
        if (!name || !email || !phone_number || !address || !username || !password) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự!" });
        }

        // 📧 2️⃣ Kiểm tra email với API Hunter.io
        const emailCheckResult = await checkEmailExists(email);
        if (!emailCheckResult.success) {
            return res.status(400).json({ message: emailCheckResult.message });
        }

        // 🔍 3️⃣ Kiểm tra email, số điện thoại, username có tồn tại không
        const [emailExists, phoneExists, usernameExists] = await Promise.all([
            User.findOne({ email }),
            User.findOne({ phone_number }),
            User.findOne({ username })
        ]);

        if (emailExists) return res.status(400).json({ message: "Email đã được sử dụng!" });
        if (phoneExists) return res.status(400).json({ message: "Số điện thoại đã được sử dụng!" });
        if (usernameExists) return res.status(400).json({ message: "Tên đăng nhập đã được sử dụng!" });

        // 🔑 4️⃣ Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 👤 5️⃣ Tạo user mới
        const user = await User.create({
            name,
            email,
            phone_number,
            address,
            username,
            password_hash: hashedPassword,
            avatar_image_path: avatar_image_path || ""
        });

        // 🎉 6️⃣ Trả về thông tin user & token
        res.status(201).json({
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
        res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau!" });
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


