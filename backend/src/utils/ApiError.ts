export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly errors: unknown[];

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors: unknown[] = []
  ) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}