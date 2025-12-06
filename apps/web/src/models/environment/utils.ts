import z from "zod";

const envSchema = z.object({
  VITE_API_HOST: z.string(),
});

export function getEnvironmentVariables() {
  const values = envSchema.parse(import.meta.env);

  return {
    apiHost: values.VITE_API_HOST,
  };
}
