import express from "express";
import router from "./api/router";
import logger from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", router);

app.listen(PORT, () => {
  logger.info(`[INFO] API Server running on port ${PORT}`);
});

export default app;
