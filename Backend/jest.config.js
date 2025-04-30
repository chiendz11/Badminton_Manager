/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  clearMocks: true,

  collectCoverage: false,

  collectCoverageFrom: [
    "services/**/*.js",
    "!**/__tests__/**",
    "!**/*.test.js",
  ],

  coverageDirectory: "coverage",

  coverageProvider: "v8",

  testEnvironment: "node",

  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)",
  ],

  moduleFileExtensions: ["js", "mjs", "json", "node"],

  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  testPathIgnorePatterns: ["\\\\node_modules\\\\"],

  transform: {
    "^.+\\.(js|mjs)$": "babel-jest",
  },

  transformIgnorePatterns: [
    "/node_modules/(?!bcryptjs|jsonwebtoken|mongoose|dotenv).+\\.js$",
  ],
};

export default config;