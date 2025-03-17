import NodeCache from "node-cache";

// Tạo đối tượng cache với checkperiod (thời gian kiểm tra expired keys)
const inMemoryCache = new NodeCache({ checkperiod: 10 });
export default inMemoryCache;
