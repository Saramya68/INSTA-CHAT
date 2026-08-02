// ==================================================================================
// FILE: server/routes/callRoutes.js
// PURPOSE: Express Router definitions for Call API Endpoints
// ==================================================================================

import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getCallHistory } from "../controllers/callController.js";

const callRouter = express.Router();

// GET /api/calls/history - Protected route to fetch call history logs
callRouter.get("/history", protectRoute, getCallHistory);

export default callRouter;
