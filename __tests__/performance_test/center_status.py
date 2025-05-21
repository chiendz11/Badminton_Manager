from locust import HttpUser, task, between, SequentialTaskSet
import random
from datetime import date, timedelta
import json # Import json để xử lý dữ liệu trả về từ API login

# Cấu hình
# Thay đổi URL này thành địa chỉ backend Express.js của bạn
BACKEND_HOST = "http://localhost:3000" # Ví dụ

# Thông tin đăng nhập Admin
ADMIN_USERNAME = "admin01"
ADMIN_PASSWORD = "123456" # Mật khẩu chưa hash dùng để gửi đi

# Danh sách các centerId bạn đã cung cấp (dùng làm fallback nếu fetch API lỗi)
FALLBACK_CENTER_IDS = [
    "67ca6e3cfc964efa218ab7d8",
    "67ca6e3cfc964efa218ab7d9",
    "67ca6e3cfc964efa218ab7d7",
    "67ca6e3cfc964efa218ab7da",
]

class AdminUser(HttpUser):
    """
    User class that simulates an Admin viewing court statuses after logging in.
    """
    # Thời gian chờ ngẫu nhiên giữa các "lượt" hành động chính của người dùng
    wait_time = between(5, 10)

    # Host của backend
    host = BACKEND_HOST

    def on_start(self):
        """
        Called when a Locust user starts. Performs login and fetches initial data.
        """
        print(f"Locust user {self.environment.runner.user_count} starting, attempting login...")

        # --- Thực hiện đăng nhập ---
        login_endpoint = "/api/admin/login"
        login_data = {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
        headers = {'Content-Type': 'application/json'} # API login nhận JSON body

        try:
            # Sử dụng self.client.post để gửi yêu cầu POST
            response = self.client.post(login_endpoint, data=json.dumps(login_data), headers=headers)

            if response.status_code == 200:
                print(f"User {self.environment.runner.user_count}: Login successful!")
                # Locust sẽ tự động lưu cookie 'adminToken' nhận được từ phản hồi
                self.is_authenticated = True # Đặt cờ báo hiệu đã đăng nhập thành công
                # Bạn có thể lưu trữ thông tin admin trả về nếu cần
                # self.admin_info = response.json().get("data")
            else:
                print(f"User {self.environment.runner.user_count}: Login failed with status code: {response.status_code}. Response body: {response.text}")
                self.is_authenticated = False
                # Tùy chọn: dừng người dùng ảo nếu không đăng nhập được
                # self.environment.runner.quit()
                return # Thoát khỏi on_start nếu login thất bại

        except Exception as e:
             print(f"User {self.environment.runner.user_count}: Error during login: {e}")
             self.is_authenticated = False
             # Tùy chọn: dừng người dùng ảo nếu gặp lỗi khi login
             # self.environment.runner.quit()
             return # Thoát khỏi on_start nếu login gặp lỗi

        # --- Fetch initial data (all centers) sau khi đăng nhập thành công ---
        self.available_center_ids = []
        if self.is_authenticated:
            try:
                # Các request sau login sẽ tự động gửi cookie adminToken
                response = self.client.get("/api/admin/center-status/get-all-centers", name="/api/admin/center-status/get-all-centers [on_start]") # Đặt tên khác để phân biệt
                if response.status_code == 200:
                    data = response.json().get("data", [])
                    self.available_center_ids = [center.get("_id") for center in data if center and center.get("_id")]
                    # print(f"User {self.environment.runner.user_count}: Fetched {len(self.available_center_ids)} center IDs on start.")
                    if not self.available_center_ids:
                        print(f"User {self.environment.runner.user_count}: Warning: No valid center IDs fetched from /get-all-centers on start.")
                else:
                    print(f"User {self.environment.runner.user_count}: Failed to fetch centers on start: Status {response.status_code}")
            except Exception as e:
                print(f"User {self.environment.runner.user_count}: Error fetching centers on start: {e}")

        # Use predefined list if fetch failed or returned empty
        if not self.available_center_ids:
             # print(f"User {self.environment.runner.user_count}: Using predefined {len(FALLBACK_CENTER_IDS)} CENTER_IDS list as fallback.")
             self.available_center_ids = FALLBACK_CENTER_IDS


    # --- Các Task mô phỏng hành động của Admin (chỉ chạy nếu đã đăng nhập) ---

    # Task này mô phỏng việc admin load lại trang hoặc làm mới danh sách trung tâm
    @task(1) # Trọng số 1: Ít xảy ra hơn việc xem trạng thái sân
    def get_all_centers_task(self):
        """
        Simulates fetching all centers.
        """
        if not self.is_authenticated: # Chỉ thực hiện nếu đã đăng nhập thành công
             # print("Skipping get_all_centers_task due to authentication failure.")
             return

        # print("Performing GET /api/admin/center-status/get-all-centers")
        self.client.get("/api/admin/center-status/get-all-centers", name="/api/admin/center-status/get-all-centers")


    # Task này mô phỏng việc admin chọn một trung tâm khác
    @task(2) # Trọng số 2: Xảy ra khi đổi trung tâm
    def get_courts_and_initial_mapping_task(self):
        """
        Simulates selecting a center, fetching courts, and then fetching mapping
        for a single default date (like today).
        """
        if not self.is_authenticated: # Chỉ thực hiện nếu đã đăng nhập thành công
            # print("Skipping get_courts_and_initial_mapping_task due to authentication failure.")
            return

        if not self.available_center_ids:
            # print("Skipping get_courts_and_initial_mapping_task: No center IDs available.")
            return

        # Chọn ngẫu nhiên một centerId
        selected_center_id = random.choice(self.available_center_ids)

        # 1. Get courts for the selected center
        # print(f"Performing GET /api/admin/center-status/get-courts for centerId: {selected_center_id}")
        self.client.get("/api/admin/center-status/get-courts", params={"centerId": selected_center_id}, name="/api/admin/center-status/get-courts")

        # 2. Fetch mapping for today (simulate default date selection)
        today_str = date.today().strftime("%Y-%m-%d")
        # print(f"Performing GET /api/admin/center-status/full-mapping for centerId: {selected_center_id} and date: {today_str} (default)")
        self.client.get(
            "/api/admin/center-status/full-mapping",
            params={"centerId": selected_center_id, "date": today_str},
            name="/api/admin/center-status/full-mapping [single date]" # Đổi tên để phân biệt
        )

    # Task này mô phỏng hành vi chính: chọn nhiều ngày và lấy trạng thái cho từng ngày
    @task(10) # Trọng số 10: Đây là hành động thường xuyên và tạo tải lớn nhất
    def view_multiple_dates_mapping_task(self):
        """
        Simulates selecting a center and then choosing 1 to 7 random dates
        within the next 30 days and fetching mapping for each. This simulates
        an admin viewing the status table for multiple days.
        """
        if not self.is_authenticated: # Chỉ thực hiện nếu đã đăng nhập thành công
            # print("Skipping view_multiple_dates_mapping_task due to authentication failure.")
            return

        if not self.available_center_ids:
            # print("Skipping view_multiple_dates_mapping_task: No center IDs available.")
            return

        # Chọn ngẫu nhiên một centerId
        selected_center_id = random.choice(self.available_center_ids)

        # 1. Get courts (simulate user having selected a center) - could make this a prerequisite
        # For simplicity in this task, we assume courts are already fetched or refetch them.
        # print(f"Performing GET /api/admin/center-status/get-courts for centerId: {selected_center_id} (before date selection)")
        self.client.get("/api/admin/center-status/get-courts", params={"centerId": selected_center_id}, name="/api/admin/center-status/get-courts")


        # 2. Simulate selecting multiple dates (1 to 7 dates within the next 30 days)
        num_dates_to_select = random.randint(1, 7)
        selected_dates = set() # Use a set to ensure unique dates

        today = date.today()
        while len(selected_dates) < num_dates_to_select:
            # Generate a random number of days between 0 and 29 (inclusive)
            random_days = random.randint(0, 29)
            target_date = today + timedelta(days=random_days)
            selected_dates.add(target_date)

        # Sort the selected dates and format them as strings
        sorted_date_strings = sorted([d.strftime("%Y-%m-%d") for d in selected_dates])

        # 3. Fetch mapping for each selected date
        # print(f"Simulating fetching mapping for {len(sorted_date_strings)} dates for centerId: {selected_center_id}")
        for date_str in sorted_date_strings:
            # print(f"Performing GET /api/admin/center-status/full-mapping for centerId: {selected_center_id} and date: {date_str}")
            self.client.get(
                "/api/admin/center-status/full-mapping",
                params={"centerId": selected_center_id, "date": date_str},
                name="/api/admin/center-status/full-mapping [multiple dates]" # Đổi tên để phân biệt
            )
            # Optional: Add a small wait between fetching mapping for different dates
            # time.sleep(random.uniform(0.1, 0.3)) # Need to import time

# Để chỉ mô phỏng *một* admin liên tục xem trạng thái sân và thay đổi ngày,
# bạn có thể chạy Locust với chỉ 1 người dùng (users=1, spawn-rate=1).
# Tuy nhiên, Locust được thiết kế để mô phỏng *nhiều* người dùng đồng thời.
# Kịch bản hiện tại mô phỏng nhiều người dùng admin độc lập truy cập trang.
# Nếu bạn *thực sự* chỉ muốn 1 instance duy nhất mô phỏng hành vi đó,
# bạn chạy với --users 1 và --spawn-rate 1. Các task với trọng số cao
# sẽ được thực hiện lặp lại thường xuyên hơn, mô phỏng việc "thay đổi ngày liên tục".

# Nếu bạn muốn mô phỏng chỉ một luồng tuần tự duy nhất cho mỗi người dùng (login -> get_centers -> get_courts -> view_multiple_dates),
# bạn có thể sử dụng cấu trúc SequentialTaskSet đã comment ở phiên bản trước.
# Nhưng với yêu cầu "các hành vi còn lại sẽ giống như việc 1 admin xem trạng thai sân và thay đổi các ngày liên tục",
# việc đặt trọng số cao cho `view_multiple_dates_mapping_task` trong lớp `HttpUser` tiêu chuẩn đã đủ để đảm bảo task này
# được thực hiện thường xuyên nhất bởi mỗi người dùng ảo sau khi họ đăng nhập.