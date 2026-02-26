import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { clearJwtAuthCookie, setJwtAuthCookie } from "../utils/cookie";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { loginService, registerService } from "../services/auth.service";

export const registerController = asyncHandler(
   async (req: Request, res: Response) => {
      const body = registerSchema.parse(req.body);

      const user = await registerService(body);
      const userId = user._id.toString();
      return setJwtAuthCookie({
         res,
         userId
      })
         .status(HTTPSTATUS.CREATED)
         .json({
            message: "User created & logged in successfully",
            user
         });
   }
);

export const loginController = asyncHandler(
   async (req: Request, res: Response) => {
      const body = loginSchema.parse(req.body);

      const user = await loginService(body);
      const userId = user._id.toString();
      return setJwtAuthCookie({
         res,
         userId
      })
         .status(HTTPSTATUS.OK)
         .json({
            message: "User logged in successfully",
            user
         });
   }
);

export const logoutController = asyncHandler(
   async (req: Request, res: Response) => {
      return clearJwtAuthCookie(res).status(HTTPSTATUS.OK).json({
         message: "User logged out successfully"
      });
   }
)

export const authStatusController = asyncHandler(
   async (req: Request, res: Response) => {
      const user = req.user;
      return res.status(HTTPSTATUS.OK).json({
         message: "User authenticated successfully",
         user
      });
   }
)