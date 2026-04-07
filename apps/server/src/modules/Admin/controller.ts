import { readFile } from "fs/promises";
import { unauthenticatedController } from "../../common/controller";
import appRoot from "app-root-path";

export const adminController = {
  // TODO: switch to controller
  getDeployInfo: unauthenticatedController(async (req) => {
    const deployInfo = await readFile(`${appRoot.path}/.deploy.info`, "utf8");

    return {
      status: 200,
      result: deployInfo ?? "no info found :(",
    };
  }),
};
