# seed_users_to_mongodb.py
# Script Python để đọc tài khoản từ CSV, hash mật khẩu và chèn vào MongoDB

import csv
import pymongo
import bcrypt # Sử dụng bcrypt để hash mật khẩu
import os
from datetime import datetime # Import datetime để thêm trường registration_date
import random # <-- Đã thêm dòng này để import thư viện random

# --- Cấu hình MongoDB ---
# Chuỗi kết nối MongoDB Atlas của bạn
MONGO_URI = "mongodb+srv://23021490:bop29042005@badmintonmanager.sxbzi.mongodb.net/BadmintonManager?retryWrites=true&w=majority"
MONGO_DB_NAME = "BadmintonManager" # Tên database của bạn (lấy từ chuỗi kết nối hoặc cấu hình của bạn)
MONGO_COLLECTION_NAME = "users" # Thay thế bằng tên collection người dùng của bạn

# --- Cấu hình Hashing Mật khẩu ---
# Số vòng lặp (salt rounds) phải giống với backend của bạn
# Bản ghi mẫu của bạn có $2a$12$, cho thấy 12 vòng lặp
BCRYPT_SALT_ROUNDS = 10

# --- Cấu hình File CSV ---
# Đường dẫn đến file CSV chứa tài khoản test
# Giả định file test_users.csv nằm cùng thư mục với script này
TEST_USERS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_users.csv")

def hash_password(password):
    """Hash mật khẩu sử dụng bcrypt."""
    # bcrypt.gensalt() tạo ra salt mới với số vòng lặp đã cấu hình
    salt = bcrypt.gensalt(rounds=BCRYPT_SALT_ROUNDS)
    # bcrypt.hashpw() hash mật khẩu với salt đã tạo
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8') # Trả về chuỗi đã hash

def seed_users(mongo_uri, db_name, collection_name, csv_file):
    """Đọc từ CSV, hash mật khẩu và chèn vào MongoDB."""
    client = None # Khởi tạo client là None
    try:
        # Kết nối tới MongoDB
        client = pymongo.MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]

        # Kiểm tra kết nối
        # Lệnh ping đơn giản để kiểm tra kết nối
        client.admin.command('ping')
        print("Kết nối MongoDB thành công!")

        # Đọc dữ liệu từ file CSV
        users_to_insert = []
        try:
            with open(csv_file, mode='r', encoding='utf-8') as infile:
                reader = csv.DictReader(infile)
                print(f"Đang đọc file CSV: {csv_file}")
                for row in reader:
                    username = row.get("username")
                    password = row.get("password")

                    if not username or not password:
                        print(f"Cảnh báo: Bỏ qua dòng thiếu username hoặc password: {row}")
                        continue

                    # Hash mật khẩu
                    hashed_password = hash_password(password)

                    # Tạo document cho người dùng
                    # Thêm các trường mặc định dựa trên cấu trúc schema mẫu của bạn
                    user_document = {
                        "username": username,
                        "password_hash": hashed_password,
                        "name": f"Test User {username}", # Tên mẫu
                        "email": f"{username}@test.com", # Email mẫu
                        "phone_number": f"09{random.randint(10000000, 99999999)}", # Số điện thoại mẫu ngẫu nhiên
                        "registration_date": datetime.utcnow(), # Ngày đăng ký hiện tại
                        "avatar_image_path": "/uploads/default-avatar.jpg", # Avatar mặc định
                        "level": "Đồng", # Level mặc định
                        "points": 0, # Điểm mặc định
                        "favouriteCenter": [], # Danh sách trung tâm yêu thích rỗng
                        "stats": { # Thống kê mặc định
                            "totalBookings": 0,
                            "completedBookings": 0,
                            "cancelledBookings": 0,
                            "averagePlayTime": "0 phút"
                        },
                        "updatedAt": datetime.utcnow(), # Thời gian cập nhật
                        "__v": 0 # Phiên bản document
                        # Không thêm các trường như resetPasswordExpires, resetPasswordToken trừ khi cần thiết cho test
                    }
                    users_to_insert.append(user_document)

        except FileNotFoundError:
            print(f"Lỗi: Không tìm thấy file CSV tại đường dẫn: {csv_file}")
            return
        except Exception as e:
            print(f"Lỗi khi đọc file CSV: {e}")
            return

        if not users_to_insert:
            print("Không có người dùng nào được đọc từ file CSV để chèn.")
            return

        # Chèn dữ liệu vào MongoDB
        print(f"Đang chèn {len(users_to_insert)} người dùng vào collection '{collection_name}'...")
        try:
            # Sử dụng insert_many để chèn nhiều document cùng lúc
            insert_result = collection.insert_many(users_to_insert)
            print(f"Đã chèn thành công {len(insert_result.inserted_ids)} bản ghi.")
        except pymongo.errors.BulkWriteError as bwe:
            print(f"Lỗi khi chèn nhiều bản ghi: {bwe.details}")
            # Log chi tiết lỗi cho từng document nếu có
            for error in bwe.details['writeErrors']:
                print(f" - Index: {error['index']}, Code: {error['code']}, Message: {error['errmsg']}")
        except Exception as e:
            print(f"Lỗi khi chèn dữ liệu vào MongoDB: {e}")

    except pymongo.errors.ConnectionFailure as e:
        print(f"Lỗi kết nối MongoDB: {e}")
    except Exception as e:
        print(f"Đã xảy ra lỗi: {e}")
    finally:
        # Đóng kết nối MongoDB
        if client:
            client.close()
            print("Đã đóng kết nối MongoDB.")

if __name__ == "__main__":
    # Chạy hàm seeding khi script được thực thi trực tiếp
    seed_users(MONGO_URI, MONGO_DB_NAME, MONGO_COLLECTION_NAME, TEST_USERS_FILE)

