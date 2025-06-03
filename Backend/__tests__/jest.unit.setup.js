// jest.setup.js
import { jest } from '@jest/globals'
jest.mock("mongoose", () => {
  const mockModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null), // Giá trị mặc định, sẽ được ghi đè trong bài kiểm thử
    })),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    find: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    save: jest.fn(),
    deleteOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    exec: jest.fn(),
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
      if (!models[name]) {
        models[name] = { ...mockModel };
      }
      return models[name];
    }),
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id),
    },
    Schema,
    models,
  };

  return mongoose;
});

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mocked-token"),
  verify: jest.fn().mockReturnValue({ id: "user123", type: "user" }),
}));

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

jest.mock("fs/promises", () => ({
  access: jest.fn().mockResolvedValue(),
  unlink: jest.fn().mockResolvedValue(),
}));

jest.unstable_mockModule('bcryptjs', () => {
  console.log('Mock bcryptjs đã được thiết lập');
  const bcryptMock = {
    genSalt: jest.fn().mockImplementation(async () => {
      console.log('bcrypt.genSalt mocked');
      return 'salt';
    }),
    hash: jest.fn().mockImplementation(async (password, salt) => {
      console.log(`bcrypt.hash mocked with password: ${password}, salt: ${salt}`);
      if (salt !== 'salt') throw new Error('Invalid salt value');
      return `hashed-${password}`;
    }),
    compare: jest.fn().mockImplementation(async (plainPass, hashedPass) => {
      console.log(`bcrypt.compare mocked with plainPass: ${plainPass}, hashedPass: ${hashedPass}`);
      const result = hashedPass === `hashed-${plainPass}`;
      console.log(`bcrypt.compare mocked result: ${result}`);
      return result;
    }),
  };
  return {
    default: bcryptMock,
  };
});

jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    join: jest.fn().mockReturnValue('/mocked/path/to/old-avatar.jpg'),
  };
});

process.env.MONGO_URI = "mongodb://localhost:27017/test";
process.env.JWT_SECRET = "test-secret";
process.env.EMAIL_SERVICE_PROVIDER = "gmail";
process.env.EMAIL_USERNAME = "test-email@example.com";
process.env.EMAIL_PASSWORD = "test-password";
process.env.EMAIL_FROM_ADDRESS = "test-email@example.com";