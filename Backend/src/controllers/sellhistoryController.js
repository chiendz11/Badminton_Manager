import * as service from "../services/sellhistoryService.js";

/** GET /api/sell-histories */
export async function getAll(req, res, next) {
  try {
    const invoices = await service.getAllSellHistories();
    res.json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
}

/** POST /api/sell-histories */
export async function create(req, res, next) {
  try {
    const payload = req.body;
    const newInvoice = await service.createSellHistory(payload);
    res.status(201).json({ success: true, data: newInvoice });
  } catch (err) {
    next(err);
  }
}