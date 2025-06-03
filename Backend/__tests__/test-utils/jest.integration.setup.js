// Backend/tests/test-utils/setup.js
import dotenv from 'dotenv';
import path from 'path';
import { app } from '../../index.js'; // Đường dẫn đến app Express của bạn
import * as db from './db.js';
import supertest from 'supertest';
import http from 'http';

export default async function setup() {
  console.log('--- Global Setup ---');

  // Điều chỉnh đường dẫn đến file .env.test.
  // path.join(process.cwd(), 'Backend', '.env.test') là đúng nếu bạn chạy Jest từ thư mục Backend/
  // Và file .env.test nằm trực tiếp trong thư mục Backend/.
  dotenv.config({ path: path.join(process.cwd(), '.env.test') });
  console.log("Đây là path", path.join(process.cwd(), '.env.test'));

  // Kết nối database test
  await db.connect(); // db.connect() sẽ sử dụng mongodb-memory-server hoặc local MongoDB

  // Khởi động server Express của bạn
  const port = process.env.PORT; // Đảm bảo có một cổng mặc định nếu PORT không được set
  const server = http.createServer(app);

  // Lắng nghe server. Nên sử dụng một cổng khác cho test để tránh xung đột
  // với server dev/prod đang chạy nếu có. Jest thường xử lý điều này tốt
  // bằng cách tự động tìm cổng trống.
  await new Promise(resolve => {
    server.listen(port, () => {
      console.log(`Test: Server chạy trên cổng ${port}`);
      resolve();
    });
  });

  global.__TEST_SERVER__ = server;
  global.request = supertest(app); // supertest sẽ gửi request đến instance 'app'
}