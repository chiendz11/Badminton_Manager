import multer from "multer";
import path from "path";
import fs from "fs/promises"; // Sử dụng fs.promises cho bất đồng bộ
import sharp from "sharp";
import { fileURLToPath } from "url";

// Xác định __dirname trong ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, "../uploads");
// Nếu không ghi được vào thư mục hiện tại, thử đổi sang vị trí khác
// const uploadDir = "C:/temp/uploads";

// Hàm kiểm tra và đảm bảo thư mục uploads tồn tại, có quyền ghi
const ensureUploadDir = async () => {
  try {
    // Kiểm tra quyền truy cập thư mục
    await fs.access(uploadDir, fs.constants.W_OK);
    console.log(`Thư mục uploads đã tồn tại và có quyền ghi: ${uploadDir}`);
  } catch (error) {
    if (error.code === "ENOENT") {
      // Thư mục không tồn tại, tạo mới
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        console.log(`Thư mục uploads đã được tạo: ${uploadDir}`);
      } catch (mkdirError) {
        console.error("Lỗi khi tạo thư mục uploads:", mkdirError);
        throw new Error("Không thể tạo thư mục uploads: " + mkdirError.message);
      }
    } else {
      // Lỗi khác (ví dụ: không có quyền ghi)
      console.error("Lỗi truy cập thư mục uploads:", error);
      throw new Error("Thư mục uploads không thể truy cập hoặc không có quyền ghi: " + error.message);
    }
  }
};

// Hàm xử lý tên file để loại bỏ khoảng trắng và ký tự đặc biệt
const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Thay thế ký tự đặc biệt và khoảng trắng bằng "_"
    .replace(/_+/g, "_"); // Loại bỏ nhiều dấu "_" liên tiếp
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
  // Sử dụng multer để xử lý field "avatar_image_path"
  upload.single("avatar_image_path")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // Lỗi từ multer (ví dụ: vượt quá kích thước file)
      return res.status(400).json({ success: false, message: `Lỗi upload: ${err.message}` });
    } else if (err) {
      // Lỗi khác (ví dụ: định dạng file không hợp lệ)
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

      // Nếu có file, xử lý và lưu file
      if (req.file) {
        const file = req.file;
        const sanitizedFileName = sanitizeFileName(file.originalname); // Xử lý tên file
        const fileName = `${Date.now()}-${sanitizedFileName}`;
        const filePath = path.join(uploadDir, fileName);

        console.log(`Đang lưu file tại: ${filePath}`);

        try {
          // Nén và resize ảnh với sharp
          await sharp(file.buffer)
            .resize({ width: 150, height: 150, fit: "cover" }) // Resize ảnh về 150x150
            .toFormat("jpeg") // Chuyển định dạng sang JPEG
            .jpeg({ quality: 80 }) // Nén chất lượng 80%
            .toFile(filePath);
        } catch (sharpError) {
          console.error("Lỗi khi dùng sharp để ghi file:", sharpError);
          // Thử ghi file trực tiếp bằng fs để kiểm tra lỗi
          try {
            console.log("Thử ghi file trực tiếp bằng fs...");
            await fs.writeFile(filePath, file.buffer);
            console.log("Ghi file trực tiếp bằng fs thành công!");
          } catch (fsError) {
            console.error("Lỗi khi ghi file trực tiếp bằng fs:", fsError);
            throw new Error("Không thể ghi file vào thư mục uploads: " + fsError.message);
          }
        }

        // Thêm URL vào req.body
        req.body.avatar_image_path = `/uploads/${fileName}`;
        console.log(`File đã được lưu, URL: ${req.body.avatar_image_path}`);
      }

      next();
    } catch (error) {
      console.error("Error in uploadMiddleware:", error);
      res.status(500).json({ success: false, message: "Lỗi khi xử lý file upload: " + error.message });
    }
  });
};