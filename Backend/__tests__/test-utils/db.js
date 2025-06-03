// __tests__/test-utils/db.js
import mongoose from 'mongoose';

// Không cần biến 'testConnection' riêng nữa, chúng ta sẽ làm việc với mongoose.connection (kết nối mặc định)

export const connect = async () => {
    // Kiểm tra xem kết nối mặc định của Mongoose đã sẵn sàng chưa
    if (mongoose.connection.readyState === 1) {
        console.log("MongoDB: Kết nối mặc định đã sẵn sàng.");
        // Nếu đã kết nối, chúng ta có thể trả về ngay
        return mongoose.connection;
    }

    try {
        const uri = 'mongodb+srv://BadmintonManager:bop29042005@cluster0.lz6cu1d.mongodb.net/BadmintonManager';
        console.log("MongoDB: Đang cố gắng kết nối mặc định tới:", uri);

        // Áp dụng các cài đặt toàn cục của Mongoose.
        // Các cài đặt này sẽ ảnh hưởng đến kết nối mặc định khi nó được thiết lập.
        mongoose.set('bufferCommands', true);
        mongoose.set('autoIndex', true);

        // Kết nối đến kết nối mặc định của Mongoose
        await mongoose.connect(uri, {
            maxPoolSize: 20,
            minPoolSize: 1,
            connectTimeoutMS: 60000,         // Timeout cho quá trình kết nối TCP ban đầu
            serverSelectionTimeoutMS: 60000, // Timeout để driver tìm và chọn server        // Timeout cho các hoạt động đọc/ghi trên socket
            maxIdleTimeMS: 60000,
            bufferTimeoutMS: 60000,
        });

        console.log("✅ MongoDB local kết nối mặc định thành công!");
        console.log("MongoDB: Trạng thái kết nối mặc định:", mongoose.connection.readyState);
        console.log("DEBUG: URI của kết nối mặc định:", mongoose.connection.client.s.url);
        console.log("DEBUG: SocketTimeoutMS của kết nối mặc định:", mongoose.connection.client.s.options.socketTimeoutMS);
        console.log("DEBUG: BufferTimeoutMS của kết nối mặc định:", mongoose.connection.client.s.options.bufferTimeoutMS);

        // Lưu trữ kết nối mặc định vào biến toàn cục để các models có thể truy cập
        // (Nếu các models của bạn vẫn sử dụng logic kiểm tra global.__TEST_DB_CONNECTION__)
        global.__TEST_DB_CONNECTION__ = mongoose.connection;

        return mongoose.connection; // Trả về đối tượng kết nối mặc định
    } catch (error) {
        console.error("❌ Lỗi kết nối MongoDB:", error.message);
        throw error;
    }
};

export const closeDatabase = async () => {
    // Kiểm tra xem kết nối mặc định của Mongoose có đang hoạt động không
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        console.log('MongoDB: Đã xóa database.');
        await mongoose.connection.close();
        console.log('MongoDB: Đã ngắt kết nối Mongoose.');
    }
    // Xóa biến toàn cục sau khi đóng kết nối
    delete global.__TEST_DB_CONNECTION__;
};

export const clearDatabase = async () => {
    // Nếu chưa kết nối, hãy kết nối trước (sẽ sử dụng kết nối mặc định)
    if (mongoose.connection.readyState !== 1) {
        await connect();
    }

    const collections = mongoose.connection.collections; // Sử dụng collections từ kết nối mặc định
    for (const key in collections) {
        const collection = collections[key];
        try {
            await collection.deleteMany({});
        } catch (error) {
            if (!error.message.includes('a system collection')) {
                console.warn(`Warning: Không thể xóa collection ${key}: ${error.message}`);
            }
        }
    }
    console.log('MongoDB: Đã xóa dữ liệu tất cả collection.');
};

export default { connect, closeDatabase, clearDatabase };