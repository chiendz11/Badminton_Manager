import Contact from "../models/contacts.js";

export const createContactService = async ({ userId, topic, content }) => {
  try {
    const newContact = new Contact({ userId, topic, content });
    const savedContact = await newContact.save();
    return savedContact;
  } catch (error) {
    throw error;
  }
};