import SibApiV3Sdk from "sib-api-v3-sdk";
import { ApiError } from "../utils/ApiError.js";

const getBrevoApiKey = (): string => {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    throw new ApiError(500, "BREVO_API_KEY not configured");
  }
  return key;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _transactionalEmailApi: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTransactionalEmailApi = (): any => {
  if (_transactionalEmailApi) return _transactionalEmailApi;

  const apiClient = SibApiV3Sdk.ApiClient.instance;
  apiClient.authentications["api-key"].apiKey = getBrevoApiKey();
  _transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();
  return _transactionalEmailApi;
};
