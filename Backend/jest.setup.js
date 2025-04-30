// Mock mongoose
jest.mock("mongoose", () => {
  const mockModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  };

  const Schema = class {
    constructor(schemaDefinition, options = {}) {
      this.schemaDefinition = schemaDefinition;
      this.options = options;
      this.preHooks = [];
      this.postHooks = [];
      this.indexes = [];
    }

    pre(hook, callback) {
      this.preHooks.push({ hook, callback });
      return this;
    }

    post(hook, callback) {
      this.postHooks.push({ hook, callback });
      return this;
    }

    index(fields, options) {
      this.indexes.push({ fields, options });
      return this;
    }
  };

  Schema.Types = {
    ObjectId: jest.fn().mockImplementation((id) => id),
    String: String,
    Number: Number,
    Boolean: Boolean,
    Buffer: Buffer,
    Date: Date,
  };

  const models = {};

  const mongoose = {
    connect: jest.fn(),
    model: jest.fn().mockImplementation((name, schema) => {
      models[name] = mockModel;
      return mockModel;
    }),
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id),
    },
    Schema,
    models,
  };

  return mongoose;
});

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  genSalt: jest.fn().mockResolvedValue("salt"),
  hash: jest.fn().mockResolvedValue("hashedPassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mocked-token"),
  verify: jest.fn().mockReturnValue({ id: "user123", type: "user" }),
}));

// Mock dotenv
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

// Mock fs/promises
jest.mock("fs/promises", () => ({
  access: jest.fn().mockResolvedValue(),
  unlink: jest.fn().mockResolvedValue(),
}));

// Mock path
jest.mock("path", () => {
  const actualPath = jest.requireActual("path");
  return {
    ...actualPath,
    dirname: jest.fn().mockImplementation((filePath) => {
      // Trả về thư mục chứa file dựa trên filePath
      return actualPath.dirname(filePath);
    }),
    resolve: jest.fn().mockImplementation((filePath) => {
      // Trả về đường dẫn thực tế dựa trên cấu trúc thư mục
      return actualPath.resolve(filePath);
    }),
  };
});

process.env.MONGO_URI = "mongodb://localhost:27017/test";
process.env.JWT_SECRET = "test-secret";
process.env.EMAIL_SERVICE_PROVIDER = "gmail";
process.env.EMAIL_USERNAME = "test-email@example.com";
process.env.EMAIL_PASSWORD = "test-password";
process.env.EMAIL_FROM_ADDRESS = "test-email@example.com";