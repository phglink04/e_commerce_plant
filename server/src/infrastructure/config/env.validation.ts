import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().port().default(5000),
  FRONTEND_URL: Joi.string().uri().required(),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default("7d"),
  AUTH_EXPOSE_DEBUG_TOKENS: Joi.boolean().default(false),

  MONGODB_MAX_POOL_SIZE: Joi.number().integer().min(1).max(200).default(50),
  MONGODB_MIN_POOL_SIZE: Joi.number().integer().min(0).max(50).default(5),
  MONGODB_MAX_IDLE_TIME_MS: Joi.number().integer().min(1000).default(60000),
  MONGODB_CONNECT_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),
  MONGODB_SOCKET_TIMEOUT_MS: Joi.number().integer().min(1000).default(30000),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1000)
    .default(5000),

  SUPABASE_URL: Joi.string().allow("", null),
  SUPABASE_KEY: Joi.string().allow("", null),
  SUPABASE_BUCKET: Joi.string().allow("", null),

  SMTP_HOST: Joi.string().allow("", null),
  SMTP_PORT: Joi.number().integer().allow(null),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow("", null),
  SMTP_PASS: Joi.string().allow("", null),
  SMTP_FROM: Joi.string().allow("", null),

  GOOGLE_CLIENT_ID: Joi.string().allow("", null),
  TWO_FACTOR_APP_NAME: Joi.string().default("PlantWorld"),

  BANK_ACQ_ID: Joi.string().allow("", null),
  BANK_ACCOUNT_NO: Joi.string().allow("", null),
  BANK_ACCOUNT_NAME: Joi.string().allow("", null),
  MB_USERNAME: Joi.string().allow("", null),
  MB_PASSWORD: Joi.string().allow("", null),
});
