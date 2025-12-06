import { ZodError, infer as ZodInfer, ZodSchema } from "zod";

export class ValidationError extends Error {
  public zodError: ZodError<unknown>;

  constructor(zodError: ZodError<unknown>) {
    super("Zod validation error");
    this.name = "ValidationError";
    this.zodError = zodError;
  }
}

export function getValidModel<TSchema extends ZodSchema<any>>(schema: TSchema, body: unknown): ZodInfer<TSchema> {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error);
    } else {
      throw error;
    }
  }
}
