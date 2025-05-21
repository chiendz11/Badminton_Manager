/** @type {import('jest').Config} */
const config = {
  // Cấu hình cơ bản
  clearMocks: true,
  testEnvironment: "node",

  // Chỉ tìm file test trong thư mục __tests__/unit_test
  testRegex: "__tests__/unit_test/.*\\.test\\.js$",

  // Bỏ qua các file không phải test
  testPathIgnorePatterns: [
    "node_modules",
    "integration_test",
    "performance_test",
    "jest\\.setup\\.js",
    "babel\\.config\\.js",
    "\\.jest\\.config\\.js"
  ],

  // Cấu hình coverage
  collectCoverage: false,
  collectCoverageFrom: [
    "Backend/services/**/*.js",
    "!**/__tests__/**",
    "!**/*.test.js"
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",

  // Định dạng file
  moduleFileExtensions: ["js", "mjs", "json", "node"],

  // Cấu hình mock
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },

  // File setup
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Transform
  transform: {
    "^.+\\.(js|mjs)$": "babel-jest"
  },

  // Bỏ qua transform cho các module cụ thể
  transformIgnorePatterns: [
    "/node_modules/(?!jsonwebtoken|mongoose|dotenv|axios|path|bcryptjs).+\\.js$"
  ],

  // Root directory là thư mục gốc
  rootDir: ".", 

  // Verbose output
  verbose: true
};

export default config;