import multer from "multer";
import path from "path";
import fs from "fs/promises"; // Sử dụng fs.promises cho bất đồng bộ
import sharp from "sharp";

const uploadDir = path.join(process.cwd(), "uploads");

// Hàm kiểm tra và đảm bảo thư mục uploads tồn tại, có quyền ghi
const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir, fs.constants.W_OK);
    console.log(`Thư mục uploads đã tồn tại và có quyền ghi: ${uploadDir}`);
  } catch (error) {
    if (error.code === "ENOENT") {
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        console.log(`Thư mục uploads đã được tạo: ${uploadDir}`);
      } catch (mkdirError) {
        console.error("Lỗi khi tạo thư mục uploads:", mkdirError);
        throw new Error("Không thể tạo thư mục uploads: " + mkdirError.message);
      }
    } else {
      console.error("Lỗi truy cập thư mục uploads:", error);
      throw new Error("Thư mục uploads không thể truy cập hoặc không có quyền ghi: " + error.message);
    }
  }
};

// Hàm xử lý tên file để loại bỏ khoảng trắng và ký tự đặc biệt
const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+/g, "_");
};

// Cấu hình multer để xử lý file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước file (5MB)
  fileFilter: (req, file, cb) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.mimetype)) {
      return cb(new Error("Định dạng file không hợp lệ! Chỉ chấp nhận JPEG, PNG, GIF."));
    }
    cb(null, true);
  },
});

// Middleware xử lý file upload
export const uploadMiddleware = (req, res, next) => {
  upload.single("avatar_image_path")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Lỗi upload: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      // Đảm bảo thư mục uploads tồn tại và có quyền ghi trước khi xử lý file
      await ensureUploadDir();

      // Kiểm tra nếu yêu cầu thay đổi avatar nhưng không có file
      if (!req.file && req.body.avatar_image_path) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp file ảnh cho avatar_image_path!",
        });
      }

      // Nếu có file, xử lý xóa ảnh cũ (nếu có) và lưu ảnh mới
      if (req.file) {
        const file = req.file;
        const sanitizedFileName = sanitizeFileName(file.originalname);
        const fileName = `${Date.now()}-${sanitizedFileName}`;
        const filePath = path.join(uploadDir, fileName);

        // Kiểm tra nếu có ảnh cũ (giả sử ảnh cũ được gửi qua req.body.old_avatar_path)
        if (req.body.old_avatar_path) {
          const oldFilePath = path.join(process.cwd(), req.body.old_avatar_path);
          try {
            // Kiểm tra xem file cũ có tồn tại không trước khi xóa
            await fs.access(oldFilePath, fs.constants.F_OK);
            await fs.unlink(oldFilePath); // Xóa ảnh cũ
            console.log(`Đã xóa ảnh cũ tại: ${oldFilePath}`);
          } catch (deleteError) {
            console.error("Lỗi khi xóa ảnh cũ:", deleteError);
            throw new Error("Lỗi hệ thống khi xóa ảnh cũ: " + deleteError.message);
          }
        }

        console.log(`Đang lưu file tại: ${filePath}`);

        // Nén và resize ảnh với sharp
        await sharp(file.buffer)
          .resize({ width: 150, height: 150, fit: "cover" })
          .toFormat("jpeg")
          .jpeg({ quality: 80 })
          .toFile(filePath);

        // Thêm URL vào req.body
        req.body.avatar_image_path = `/uploads/${fileName}`;
        console.log(`File đã được lưu, URL: ${req.body.avatar_image_path}`);
      }

      next();
    } catch (error) {
      console.error("Error in uploadMiddleware:", error);
      if (error.message.includes("Input buffer contains unsupported image format")) {
        return res.status(500).json({
          success: false,
          message: "Lỗi hệ thống khi xử lý ảnh không được hỗ trợ",
        });
      }
      res.status(500).json({ success: false, message: "Lỗi khi xử lý file upload: " + error.message });
    }
  });
};