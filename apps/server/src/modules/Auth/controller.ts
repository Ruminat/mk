import { unauthenticatedController, controller } from "../../common/http/controller";
import { getValidModel } from "../../common/http/validation";
import { TelegramAuthSchema } from "./schema";
import { authService } from "./service";
import { TSelectUser } from "./model";

function toPublicUser(user: TSelectUser) {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
}

export const authController = {
  signInWithTelegram: unauthenticatedController(async (req) => {
    const authData = getValidModel(TelegramAuthSchema, req.body);
    const { user, token } = await authService.signInWithTelegram(authData);

    return {
      status: 200,
      result: {
        user: toPublicUser(user),
        token,
      },
    };
  }),

  getMe: controller(async (req) => {
    // User is attached to request by auth middleware
    return {
      status: 200,
      result: {
        user: toPublicUser(req.user),
      },
    };
  }),
};

