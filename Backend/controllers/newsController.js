import { getAllNews } from "../services/newsServices.js";

export const getNewsController = async (req, res) => {
  try {
    const news = await getAllNews();
    res.status(200).json({ success: true, news });
  } catch (error) {
    console.error("Error in getNewsController:", error);
    res.status(500).json({ success: false, message: "Error fetching news" });
  }
};
