import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import Auth from "./Routes/Authentication/Auth.js";
import FetchProperty from "./Routes/Property/FetchingProperty.js";
import UpdateProperty from "./Routes/Property/UpdatingProperty.js";
import PrimaryTransaction from "./Routes/Transactions/PrimaryTransactions.js"
import Holdings from "./Routes/Holdings/Holding.js"
import Listings from "./Routes/Listings/Listing.js"
import Stats from "./Routes/Analytics/Analytics.js"

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(cookieParser());
app.use(express.json());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ownexa-backend"
  });
});

// ROUTES
app.use("/", Auth);
app.use("/", UpdateProperty);
app.use("/", FetchProperty);
app.use("/", PrimaryTransaction);
app.use("/", Holdings);
app.use("/", Listings);
app.use("/", Stats);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
