import express from "express";
import { saveState } from "../utils/state";
import logger from "../utils/logger";

const router = express.Router();

router.post("/reset-general-ledger", async (req, res) => {
  try {
    await saveState("general_ledger", { isFirstRun: true });
    logger.info("[INFO] General ledger state reset successfully");
    res
      .status(200)
      .json({ message: "General ledger state reset successfully" });
  } catch (error: any) {
    logger.error("[ERROR] Failed to reset general ledger state:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Failed to reset general ledger state" });
  }
});

export default router;
