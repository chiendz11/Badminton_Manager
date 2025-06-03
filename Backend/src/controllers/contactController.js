import { createContactService } from "../services/contactServices.js";

export const createContactController = async (req, res) => {
  try {
    const { userId, topic, content } = req.body;
    if (!userId || !topic || !content) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const contact = await createContactService({ userId, topic, content });
    return res.status(201).json({ success: true, contact });
  } catch (error) {
    console.error("Error creating contact:", error);
    return res.status(500).json({ success: false, message: "Error creating contact" });
  }
};