export const getRedisUrl = (): string => {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "REDIS_URL environment variable is not set. " +
        "Set it to your Upstash Redis connection string.",
    );
  }
  return url;
};

export const redisConnection = {
  get url() {
    return getRedisUrl();
  },
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
  tls: {},
} as const;
