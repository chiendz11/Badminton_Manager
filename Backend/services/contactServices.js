import Contact from "../models/contacts.js";

export const createContactService = async ({ userId, topic, content }) => {
  try {
    const newContact = new Contact({ userId, topic, content });
    await newContact.save();
    return newContact;
  } catch (error) {
    throw error;
  }
};
