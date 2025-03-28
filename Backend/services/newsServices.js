import New from "../models/news.js"; // Lưu ý: model của bạn được đặt tên là "New"

export const getAllNews = async () => {
  try {
    // Trả về tất cả các bản tin, sắp xếp theo thời gian tạo mới nhất
    const news = await New.find({}).sort({ createdAt: -1 });
    return news;
  } catch (error) {
    throw new Error("Error retrieving news: " + error.message);
  }
};
