const env = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
} as const;

export default env;
