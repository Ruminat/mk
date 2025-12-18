import { unauthenticatedController, controller } from "../../common/controller";
import { getValidModel } from "../../common/validation";
import { TelegramAuthSchema, EmailAuthSchema } from "./schema";
import { authService } from "./service";

export const authController = {
  signInWithTelegram: unauthenticatedController(async (req) => {
    const authData = getValidModel(TelegramAuthSchema, req.body);
    const { user, token } = await authService.signInWithTelegram(authData);

    return {
      status: 200,
      result: {
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          email: user.email,
          authProvider: user.authProvider,
        },
        token,
      },
    };
  }),

  signUpWithEmail: unauthenticatedController(async (req) => {
    const authData = getValidModel(EmailAuthSchema, req.body);
    const { user, token } = await authService.signUpWithEmail(authData);

    return {
      status: 201,
      result: {
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          email: user.email,
          authProvider: user.authProvider,
        },
        token,
      },
    };
  }),

  signInWithEmail: unauthenticatedController(async (req) => {
    const authData = getValidModel(EmailAuthSchema, req.body);
    const { user, token } = await authService.signInWithEmail(authData);

    return {
      status: 200,
      result: {
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          email: user.email,
          authProvider: user.authProvider,
        },
        token,
      },
    };
  }),

  getMe: controller(async (req) => {
    // User is attached to request by auth middleware
    const user = req.user;

    return {
      status: 200,
      result: {
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          email: user.email,
          authProvider: user.authProvider,
        },
      },
    };
  }),
};

