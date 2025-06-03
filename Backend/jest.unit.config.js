// Backend/jest.config.js
/** @type {import('jest').Config} */
const config = {
  // Cấu hình cơ bản
  clearMocks: true,
  testEnvironment: "node",
  // jest.setup.js cũng đã được di chuyển vào thư mục tests/
  setupFilesAfterEnv: ["<rootDir>/tests/jest.unit.setup.js"], // Đảm bảo đường dẫn đúng

  // Chỉ tìm file test trong thư mục __tests__/unit_test
  // Đường dẫn đã được điều chỉnh (tests/unit_test/)
  testRegex: "__tests__/unit_test/.*\\.test\\.js$",

  // Bỏ qua các file không phải test
  testPathIgnorePatterns: [
    "node_modules",
    "__tests__/integration_test", // Cần bỏ qua integration_test của Backend/tests
    "__tests__/performance_test",
    "__tests__/jest.unit.setup.js", // File setup này nằm trong tests/, không phải rootDir
    // Các file config này cũng nằm trong Backend/
    "jest.unit.config.js",
    "jest.integration.config.js"
  ],

  // Thêm transform để xử lý ES modules
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Cấu hình coverage
  collectCoverage: false,
  // Đường dẫn cho collectCoverageFrom giờ sẽ bắt đầu từ rootDir (Backend/)
  collectCoverageFrom: [
    // Giả sử các service của Backend nằm trong Backend/src/services/
    "src/services/**/*.js", // Hoặc "services/**/*.js" nếu chúng trực tiếp dưới Backend/
    "!**/__tests__/**", // Thay đổi từ __tests__ thành tests
    "!**/*.test.js"
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",

  // Định dạng file
  moduleFileExtensions: ["js", "mjs", "json", "node"],

  // Cấu hình mock
  moduleNameMapper: {
    // Nếu bạn đang mock các module ES6, cần đảm bảo chúng không bị Jest xử lý nhầm
    // Rule này thường dành cho các trường hợp đặc biệt với CommonJS/ESM
    // "^(\\.{1,2}/.*)\\.js$": "$1",
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__tests__/__mocks__/fileMock.js", // Giả sử mocks nằm trong Backend/tests/__mocks__
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },

  // Transform
  transform: {
    "^.+\\.(js|mjs)$": "babel-jest"
  },

  // Bỏ qua transform cho các module cụ thể
  // Đường dẫn đã được điều chỉnh để phù hợp với Backend/node_modules
  transformIgnorePatterns: [
    "/node_modules/(?!jsonwebtoken|mongoose|dotenv|axios|path|bcryptjs).+\\.js$"
  ],

  // Root directory là thư mục hiện tại (Backend/)
  rootDir: ".",

  // Verbose output
  verbose: true
};

export default config;