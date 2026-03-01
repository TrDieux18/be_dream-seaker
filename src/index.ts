import cookieParser from "cookie-parser";
import "dotenv/config";
import cors from "cors"
import http from "http"
import express, { Request, Response } from "express";
import passport, { initialize } from "passport";
import { Env } from "./config/env.config";
import { asyncHandler } from "./middleware/async-handler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middleware/error-handler.middleware";
import connectDatabase from "./config/database.config,";
import "./config/passport.config";
import routes from "./routes";
import { initializeSocket } from "./lib/socket";

const app = express();

const server = http.createServer(app)

//socket
initializeSocket(server);

app.use((req, res, next) => {
   console.log(`${req.method} ${req.originalUrl}`, {
      query: req.query,
      body: req.body,
      params: req.params,
   });
   next();
});

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
app.use(
   cors({
      origin: Env.FRONTEND_ORIGIN ? Env.FRONTEND_ORIGIN.split(",") : [],
      credentials: true
   })
);


app.use(passport.initialize());

app.get("/health", asyncHandler(async (req: Request, res: Response) => {
   res.status(HTTPSTATUS.OK).json({
      status: "OK",
      message: "Server is healthy"
   })
}))

app.use("/api", routes)

app.use(errorHandler)

server.listen(Env.PORT, async () => {
   await connectDatabase();
   console.log(`🚀 Server is running on port ${Env.PORT}`);
})