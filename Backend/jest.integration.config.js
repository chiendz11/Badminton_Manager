// jest.integration.config.js
export default {
  // Môi trường chạy test
  testEnvironment: 'node',

  // Chỉ chạy các file test trong thư mục integration_test
  testRegex: "__tests__/integration_test/.*\\.integration\\.test\\.js$",

  // Bỏ qua các thư mục không cần thiết
  testPathIgnorePatterns: [
    "node_modules",
    "__tests__/unit_test",
    "__tests__/performance_test"
  ],

  // Thời gian chờ tối đa cho mỗi test case (30 giây)
  testTimeout: 60000,

  // Cấu hình module name mapper nếu cần
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },

  // **THÊM CẤU HÌNH TRANSFORM NÀY**
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  // **KẾT THÚC CẤU HÌNH TRANSFORM**

  // Chạy setup trước khi test
  globalSetup: "<rootDir>/__tests__/test-utils/jest.integration.setup.js",

  // Chạy teardown sau khi test
  globalTeardown: "<rootDir>/__tests__/test-utils/jest.integration.teardown.js",

  // Chạy setup trước mỗi test file
  setupFilesAfterEnv: [],

  // Báo cáo coverage
  collectCoverage: true,
  coverageDirectory: "coverage-integration",
  collectCoverageFrom: [
    "Backend/**/*.js",
    "!**/__tests__/**",
    "!**/node_modules/**"
  ]
};