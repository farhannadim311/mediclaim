import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import * as pino from "pino";
import { ClaimVerifierService } from "./services/claim-verifier-service.js";
import { WalletService } from "./services/wallet-service.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Create logger
const logger = pino.pino({
  level: process.env.LOG_LEVEL || "info",
});

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(
    {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    },
    "HTTP Request"
  );
  next();
});

// Initialize services
const walletService = new WalletService(logger);
const claimVerifierService = new ClaimVerifierService(logger);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "claim-verifier-api-bridge",
  });
});

// Wallet endpoints
app.post("/api/wallet/connect", async (req, res) => {
  try {
    const { seed } = req.body;

    if (!seed || typeof seed !== "string") {
      return res
        .status(400)
        .json({ error: "Seed is required and must be a string" });
    }

    const walletConnection = await walletService.connectWallet(seed);
    res.json(walletConnection);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to connect wallet";
    logger.error({ error: errorMessage }, "Failed to connect wallet");
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/wallet/generate", async (req, res) => {
  try {
    const walletConnection = await walletService.generateWallet();
    res.json(walletConnection);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate wallet";
    logger.error({ error: errorMessage }, "Failed to generate wallet");
    res.status(500).json({ error: errorMessage });
  }
});

// Contract endpoints
app.post("/api/contract/deploy", async (req, res) => {
  try {
    const { walletSeed } = req.body;

    if (!walletSeed) {
      return res.status(400).json({ error: "Wallet seed is required" });
    }

    const result = await claimVerifierService.deployContract(walletSeed);
    res.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to deploy contract";
    logger.error({ error: errorMessage }, "Failed to deploy contract");
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/contract/join", async (req, res) => {
  try {
    const { walletSeed, contractAddress } = req.body;

    if (!walletSeed || !contractAddress) {
      return res
        .status(400)
        .json({ error: "Wallet seed and contract address are required" });
    }

    const result = await claimVerifierService.joinContract(
      walletSeed,
      contractAddress
    );
    res.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to join contract";
    logger.error({ error: errorMessage }, "Failed to join contract");
    res.status(500).json({ error: errorMessage });
  }
});

// Claim verification endpoints
app.post("/api/claims/verify", async (req, res) => {
  try {
    const claimData = req.body;

    if (!claimData.walletSeed) {
      return res.status(400).json({ error: "Wallet seed is required" });
    }

    const result = await claimVerifierService.verifyClaim(claimData);
    res.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to verify claim";
    logger.error({ error: errorMessage }, "Failed to verify claim");
    res.status(500).json({ error: errorMessage });
  }
});

app.get("/api/claims/:walletSeed", async (req, res) => {
  try {
    const { walletSeed } = req.params;

    if (!walletSeed) {
      return res.status(400).json({ error: "Wallet seed is required" });
    }

    const claims = await claimVerifierService.getClaims(walletSeed);
    res.json(claims);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get claims";
    logger.error({ error: errorMessage }, "Failed to get claims");
    res.status(500).json({ error: errorMessage });
  }
});

app.get("/api/claims/:walletSeed/:claimId", async (req, res) => {
  try {
    const { walletSeed, claimId } = req.params;

    if (!walletSeed || !claimId) {
      return res
        .status(400)
        .json({ error: "Wallet seed and claim ID are required" });
    }

    const claim = await claimVerifierService.getClaimStatus(
      walletSeed,
      claimId
    );
    res.json(claim);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get claim status";
    logger.error({ error: errorMessage }, "Failed to get claim status");
    res.status(500).json({ error: errorMessage });
  }
});

// Contract state endpoints
app.get(
  "/api/contract/:walletSeed/:contractAddress/state",
  async (req, res) => {
    try {
      const { walletSeed, contractAddress } = req.params;

      if (!walletSeed || !contractAddress) {
        return res
          .status(400)
          .json({ error: "Wallet seed and contract address are required" });
      }

      const state = await claimVerifierService.getContractState(
        walletSeed,
        contractAddress
      );
      res.json(state);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get contract state";
      logger.error({ error: errorMessage }, "Failed to get contract state");
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Error handling middleware
app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error(
      { error: error.message, stack: error.stack },
      "Unhandled error"
    );
    res.status(500).json({ error: "Internal server error" });
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
const server = createServer(app);

server.listen(port, () => {
  logger.info({ port }, "API Bridge server started");
  logger.info(`Server running at http://localhost:${port}`);
  logger.info("Health check: GET /health");
  logger.info("API documentation: https://github.com/your-repo/api-docs");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

export default app;
