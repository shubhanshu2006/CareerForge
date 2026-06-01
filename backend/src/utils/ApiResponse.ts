export class ApiResponse<T> {
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly data: T;
  public readonly message: string;

  constructor(statusCode: number, data: T, message = "Success") {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.data = data;
    this.message = message;
  }
}
