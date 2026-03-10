import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { availabilityRouter } from "./routes/availability.routes";
import { appointmentsRouter } from "./routes/appointments.routes";
import { superadminRouter } from "./routes/superadmin.routes";
import { tenantsRouter } from "./routes/tenants.routes";
import { waitlistRouter } from "./routes/waitlist.routes";
import { documentsRouter } from "./routes/documents.routes";
import { publicRouter } from "./routes/public.routes";
import { usersRouter } from "./routes/users.routes";
import { patientsRouter } from "./routes/patients.routes";
import { servicesRouter } from "./routes/services.routes";
import { serviceRulesRouter } from "./routes/serviceRules.routes";
import { workingHoursRouter } from "./routes/workingHours.routes";
import { breaksRouter } from "./routes/breaks.routes";
import { timeOffRouter } from "./routes/timeOff.routes";
import { holidaysRouter } from "./routes/holidays.routes";

export const app = express();

// Baseline security and request parsing for the API.
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate-limit authentication endpoints to slow down brute-force attempts.
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 20,
	standardHeaders: true,
	legacyHeaders: false
});

// Auth routes (login) are protected by the limiter.
app.use(authLimiter, authRouter);
// Health endpoint used by monitoring to verify global + tenant DBs.
app.use(healthRouter);
app.use(tenantsRouter);
app.use(superadminRouter);
app.use(availabilityRouter);
app.use(appointmentsRouter);
app.use(waitlistRouter);
app.use(documentsRouter);
app.use(publicRouter);
app.use(usersRouter);
app.use(patientsRouter);
app.use(servicesRouter);
app.use(serviceRulesRouter);
app.use(workingHoursRouter);
app.use(breaksRouter);
app.use(timeOffRouter);
app.use(holidaysRouter);

// Centralized error handling for all routes.
app.use(errorHandler);
