import UserModel from "../models/user.model";
import { NotFoundException, UnauthorizedException } from "../utils/app-error";
import {
  LoginSchemaType,
  RegisterSchemaType,
} from "../validators/auth.validator";
import { generateUsernameSuggestions } from "../utils/generate-usernames";

export const registerService = async (body: RegisterSchemaType) => {
  const { email, name } = body;

  
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) throw new UnauthorizedException("User already exist");

  
  const suggestions = generateUsernameSuggestions(name, 20);
  let username = "";

  
  for (const suggestion of suggestions) {
    const existingUsername = await UserModel.findOne({ username: suggestion });
    if (!existingUsername) {
      username = suggestion;
      break;
    }
  }

  
  if (!username) {
    const baseUsername = suggestions[0] || "user";
    const randomNum = Math.floor(Math.random() * 10000);
    username = `${baseUsername}${randomNum}`;
  }

  const newUser = new UserModel({
    name: body.name,
    username: username,
    email: body.email,
    password: body.password,
    avatar: body.avatar,
  });
  await newUser.save();
  return newUser;
};

export const loginService = async (body: LoginSchemaType) => {
  const { email, password } = body;

  const user = await UserModel.findOne({ email });
  if (!user) throw new NotFoundException("Invaild email or password");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid)
    throw new UnauthorizedException("Invaild email or password");

  return user;
};
