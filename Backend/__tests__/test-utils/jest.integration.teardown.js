import * as db from './db.js';

export default async () => {
  console.log('--- Global Teardown ---');
  await db.closeDatabase();
  if (global.__TEST_SERVER__) {
    await new Promise(resolve => global.__TEST_SERVER__.close(resolve));
  }
  global.__TEST_SERVER__ = null;
  global.request = null;
  console.log('--- Teardown hoàn tất ---');
};