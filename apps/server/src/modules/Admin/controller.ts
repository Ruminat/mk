import { readFile } from "fs/promises";
import { controller } from "../../common/http/controller";
import appRoot from "app-root-path";

export const adminController = {
  // Admin-only: guarded by `authenticate` + `requireAdmin` in the route.
  getDeployInfo: controller(async (req) => {
    const deployInfo = await readFile(`${appRoot.path}/.deploy.info`, "utf8");

    return {
      status: 200,
      result: deployInfo ?? "no info found :(",
    };
  }),
};
