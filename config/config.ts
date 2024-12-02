if (!process.env.DATABASE_URL) {
  throw new Error("Please Provide Database URL!");
}

if (!process.env.JWT_ACCESS_TOKEN_KEY) {
  throw new Error("Please Provide JWT Access Token Key!");
}

if (!process.env.JWT_REFRESH_TOKEN_KEY) {
  throw new Error("Please Provide JWT Refresh Token Key!");
}

if (!process.env.JWT_ACCESS_TOKEN_EXPIRES_IN) {
  throw new Error("Please Provide JWT Access Token Expires In Date/Time!");
}

if (!process.env.JWT_REFRESH_TOKEN_EXPIRES_IN) {
  throw new Error("Please Provide JWT Refresh Token Expires In Date/Time!");
}

export const config = {
  _env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_ACCESS_TOKEN_KEY: process.env.JWT_ACCESS_TOKEN_KEY,
    JWT_REFRESH_TOKEN_KEY: process.env.JWT_REFRESH_TOKEN_KEY,
    JWT_ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    JWT_REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  },
};
