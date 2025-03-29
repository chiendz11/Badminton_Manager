// src/api/inventoryAPI.js
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export async function getInventories() {
  try {
    const response = await axios.get(`${API_URL}/api/inventories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching inventories:', error);
    throw error;
  }
}
