# booking.py
# File này được tạo ra để kiểm thử hiệu năng của các chức năng booking, bao gồm đăng nhập và xác nhận booking.

from locust import HttpUser, task, between, SequentialTaskSet, constant
import random
from datetime import date, timedelta, datetime
import os
import json
import csv
import queue

# --- Cấu hình ---
API_HOST = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/users/login"
CSRF_TOKEN_ENDPOINT = "/api/csrf-token"
POSSIBLE_HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
FIXED_TOTAL_AMOUNT = 100000
BASE64_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "encoded.txt")
FIXED_NOTE = "test"
FIXED_USER_ID_FALLBACK = "67bd323489acfa439c4d7947"
CSRF_COOKIE_NAME = "_csrf"
CSRF_TOKEN_BODY_KEY = "csrfToken"

# --- Dữ liệu Centers và Courts (đã cung cấp) ---
ALL_CENTERS_DATA = [
    { "_id": { "$oid": "67ca6e3cfc964efa218ab7d8" }, "name": "Nhà thi đấu quận Thanh Xuân", "totalCourts": 4 },
    { "_id": { "$oid": "67ca6e3cfc964efa218ab7d9" }, "name": "Nhà thi đấu quận Cầu Giấy", "totalCourts": 6 },
    { "_id": { "$oid": "67ca6e3cfc964efa218ab7d7" }, "name": "Nhà thi đấu quận Tây Hồ", "totalCourts": 5 },
    { "_id": { "$oid": "67ca6e3cfc964efa218ab7da" }, "name": "Nhà thi đấu quận Bắc Từ Liêm", "totalCourts": 7 }
]

ALL_COURTS_DATA = [
    { "_id": { "$oid": "67d852208592f1451fe4a3c0" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d9" }, "name": "Sân 1" },
    { "_id": { "$oid": "67d852208592f1451fe4a3c1" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d9" }, "name": "Sân 2" },
    { "_id": { "$oid": "67d852208592f1451fe4a3c7" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7da" }, "name": "Sân 3" },
    { "_id": { "$oid": "67d852208592f1451fe4a3c8" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7da" }, "name": "Sân 4" },
    { "_id": { "$oid": "67d852208592f1451fe4a3d2" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7da" }, "name": "Sân 7" },
    { "_id": { "$oid": "67d852208592f1451fe4a3b8" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d7" }, "name": "Sân 3" },
    { "_id": { "$oid": "67d852208592f1451fe4a3b9" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d7" }, "name": "Sân 4" },
    { "_id": { "$oid": "67ca6e3cfc964efa218ab7da" }, "name": "Sân 5" }, # This court has no centerId in the provided data
    { "_id": { "$oid": "67d852208592f1451fe4a3bb" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d8" }, "name": "Sân 1" },
    { "_id": { "$oid": "67d852208592f1451fe4a3c9" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7da" }, "name": "Sân 5" },
    { "_id": { "$oid": "67d852208592f1451fe4a3b6" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d7" }, "name": "Sân 1" },
    { "_id": { "$oid": "67d852208592f1451fe4a3bd" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d8" }, "name": "Sân 3" },
    { "_id": { "$oid": "67d852208592f1451fe4a3c2" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d9" }, "name": "Sân 3" },
    { "_id": { "$oid": "67d852208592f1451fe4a3c3" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d9" }, "name": "Sân 4" },
    { "_id": { "$oid": "67d852208592f1451fe4a3c4" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d9" }, "name": "Sân 5" },
    { "_id": { "$oid": "67d852208592f1451fe4a3c5" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7da" }, "name": "Sân 1" },
    { "_id": { "$oid": "67d852208592f1451fe4a3c6" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7da" }, "name": "Sân 2" },
    { "_id": { "$oid": "67d852208592f1451fe4a3d1" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7da" }, "name": "Sân 6" },
    { "_id": { "$oid": "67d852208592f1451fe4a3b7" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d7" }, "name": "Sân 2" },
    { "_id": { "$oid": "67d852208592f1451fe4a3bc" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d8" }, "name": "Sân 2" },
    { "_id": { "$oid": "67d852208592f1451fe4a3be" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d8" }, "name": "Sân 4" },
    { "_id": { "$oid": "67d852208592f1451fe4a3d0" }, "centerId": { "$oid": "67ca6e3cfc964efa218ab7d9" }, "name": "Sân 6" }
]

# Map center OID to a list of court OIDs for easy lookup
CENTER_COURTS_MAP = {}
for court in ALL_COURTS_DATA:
    center_oid = court['centerId']['$oid'] if 'centerId' in court else None
    court_oid = court['_id']['$oid']
    if center_oid: # Only add if centerId exists
        if center_oid not in CENTER_COURTS_MAP:
            CENTER_COURTS_MAP[center_oid] = []
        CENTER_COURTS_MAP[center_oid].append(court_oid)

# List of all center OIDs to choose from
ALL_CENTER_OIDS = [center['_id']['$oid'] for center in ALL_CENTERS_DATA]

# --- Cấu hình Tài khoản Test ---
TEST_USERS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_users.csv")
user_queue = queue.Queue()

try:
    with open(TEST_USERS_FILE, mode='r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            user_queue.put(row)
    print(f"Loaded {user_queue.qsize()} test users from {TEST_USERS_FILE}")
except FileNotFoundError:
    print(f"Error: Test users file not found at {TEST_USERS_FILE}. Please create it and populate with test users.")
except Exception as e:
    print(f"Error reading test users file {TEST_USERS_FILE}: {e}")


class BookingUser(HttpUser):
    wait_time = between(5, 10) # Đã thay đổi thành constant(0) để kiểm tra thông lượng tối đa
    host = API_HOST

    auth_token = None
    user_id_from_login = None
    user_name_from_login = None
    is_authenticated = False
    shared_date = None
    fixed_payment_image_base64 = None
    has_selected_timeslot = False
    csrf_token_value = None

    username = None
    password = None

    selected_center_id = None
    selected_court_id = None
    rejected_timeslots_cache = {}


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_client_post = self.client.post
        self._original_client_put = self.client.put
        self._original_client_delete = self.client.delete
        self.client.post = self._custom_post
        self.client.put = self._custom_put
        self.client.delete = self._custom_delete

    def _reset_booking_context(self):
        """
        Resets the selected center, court, date, and clears the rejected timeslots cache
        for the next booking attempt.
        """
        # Select a random date for the user's session (within the next 30 days)
        random_date = date.today() + timedelta(days=random.randint(0, 29))
        self.shared_date = random_date.strftime("%Y-%m-%d")
        print(f"User {self.username}: Session date set to {self.shared_date}")

        # Choose a random Center and Court
        if ALL_CENTER_OIDS:
            self.selected_center_id = random.choice(ALL_CENTER_OIDS)
            valid_courts_for_center = CENTER_COURTS_MAP.get(self.selected_center_id, [])
            if valid_courts_for_center:
                self.selected_court_id = random.choice(valid_courts_for_center)
                print(f"User {self.username}: Selected Center: {self.selected_center_id}, Court: {self.selected_court_id}")
            else:
                print(f"User {self.username}: Warning: No valid courts found for selected center {self.selected_center_id}. Cannot perform booking tasks.")
                self.selected_center_id = None
                self.selected_court_id = None
        else:
            print(f"User {self.username}: Warning: No centers available for selection. Cannot perform booking tasks.")
            self.selected_center_id = None
            self.selected_court_id = None

        # Clear the rejected timeslots cache for the new context
        self.rejected_timeslots_cache = {}
        self.has_selected_timeslot = False # Reset flag


    def _toggle_pending_timeslot_internal(self):
        """Helper: Simulates selecting/deselecting a timeslot in cache.
        Returns the selected_hour if successful (200 response and timeslot reflected), None otherwise.
        Updates rejected_timeslots_cache if a timeslot is rejected at this stage.
        """
        if not self.is_authenticated:
            return None

        if not self.selected_center_id or not self.selected_court_id:
            print(f"User {self.username}: No center/court selected. Skipping internal toggle.")
            return None

        current_hour = datetime.now().hour
        available_hours = [hour for hour in POSSIBLE_HOURS]
        if self.shared_date == date.today().strftime("%Y-%m-%d"):
             available_hours = [hour for hour in available_hours if hour > current_hour]

        cache_key = (self.selected_center_id, self.selected_court_id, self.shared_date)
        current_rejected_slots = self.rejected_timeslots_cache.get(cache_key, set())

        max_toggle_attempts = 5 # Number of attempts to successfully toggle a timeslot
        for attempt in range(max_toggle_attempts):
            # Filter out already rejected slots from available_hours
            selectable_hours = [hour for hour in available_hours if hour not in current_rejected_slots]

            if not selectable_hours:
                print(f"User {self.username}: No more unique timeslots to try for {self.shared_date} on court {self.selected_court_id} after filtering rejected ones at toggle stage.")
                return None

            selected_hour = random.choice(selectable_hours)
            toggle_data = {
                "name": self.user_name_from_login or self.username or "Test User",
                "userId": self.user_id_from_login or FIXED_USER_ID_FALLBACK,
                "centerId": self.selected_center_id,
                "date": self.shared_date,
                "courtId": self.selected_court_id,
                "timeslot": selected_hour
            }
            response = self.client.post("/api/booking/pending/toggle", json=toggle_data, name="/api/booking/pending/toggle")

            if response.status_code == 200:
                try:
                    response_json = response.json()
                    # Verify if the selected timeslot is actually in the returned booking
                    # This assumes the toggle response returns the current pending booking state
                    if response_json and response_json.get('booking') and response_json['booking'].get('courts'):
                        found_timeslot_in_response = False
                        for court_booking in response_json['booking']['courts']:
                            if court_booking.get('courtId') == self.selected_court_id and selected_hour in court_booking.get('timeslots', []):
                                found_timeslot_in_response = True
                                break
                        if found_timeslot_in_response:
                            # Successfully toggled and confirmed in response
                            return selected_hour
                    # If not found or response structure unexpected, treat as failed toggle for this attempt
                    print(f"User {self.username}: Toggle successful (200) but selected timeslot {selected_hour} not reflected in response for court {self.selected_court_id}. Response: {response.text}")
                    current_rejected_slots.add(selected_hour) # Add to rejected as it wasn't confirmed by response
                    self.rejected_timeslots_cache[cache_key] = current_rejected_slots
                    # Continue to next attempt
                except Exception as e:
                    print(f"User {self.username}: Error parsing toggle response or verifying selected timeslot: {e}. Response: {response.text}")
                    current_rejected_slots.add(selected_hour) # Add to rejected due to parsing error
                    self.rejected_timeslots_cache[cache_key] = current_rejected_slots
                    # Continue to next attempt
            elif response.status_code == 500 and "đã được đặt bởi người khác" in response.text:
                print(f"User {self.username}: Timeslot {selected_hour} on court {self.selected_court_id} for {self.shared_date} already booked at toggle stage. Attempting another slot (attempt {attempt + 1}/{max_toggle_attempts}).")
                current_rejected_slots.add(selected_hour)
                self.rejected_timeslots_cache[cache_key] = current_rejected_slots
                # Continue to next attempt
            else:
                print(f"User {self.username}: Toggle_pending_timeslot failed with unexpected status code: {response.status_code}. Data: {toggle_data}. Response: {response.text}")
                # For other errors, we might want to just fail this attempt and potentially the whole booking flow
                return None # Fail this attempt and stop trying to toggle

        print(f"User {self.username}: All {max_toggle_attempts} attempts to toggle a timeslot failed for {self.shared_date} on court {self.selected_court_id}.")
        return None # No timeslot successfully toggled after retries


    @task(5)
    def book_and_confirm_court(self):
        """Task: Full booking flow: toggle timeslot -> save pending -> confirm processing."""
        if not self.is_authenticated:
            return

        # Loop to try multiple timeslots if previous attempts fail due to conflicts
        max_full_booking_attempts = 3 # Max attempts for the entire booking flow (toggle + save)
        for attempt_num in range(max_full_booking_attempts):
            print(f"User {self.username}: Starting full booking attempt {attempt_num + 1}/{max_full_booking_attempts}.")

            # Step 1: Toggle a timeslot (select it in cache)
            # This will return the selected_hour if successful, None otherwise.
            selected_hour_for_booking = self._toggle_pending_timeslot_internal()

            if selected_hour_for_booking is None:
                print(f"User {self.username}: Failed to select a timeslot after internal retries. Moving to next task iteration.")
                self.has_selected_timeslot = False # Ensure flag is reset
                # If toggle fails, reset context and try a new booking cycle in the next task iteration
                self._reset_booking_context()
                return # Exit this task, will try again in next Locust iteration

            # Step 2: Save pending booking to DB
            print(f"User {self.username}: Attempting to save pending booking to DB for Center: {self.selected_center_id}, Court: {self.selected_court_id}, Timeslot: {selected_hour_for_booking}.")
            pending_booking_id = None
            confirm_data = {
                "userId": self.user_id_from_login or FIXED_USER_ID_FALLBACK,
                "centerId": self.selected_center_id,
                "date": self.shared_date,
                "totalAmount": FIXED_TOTAL_AMOUNT,
                "name": self.user_name_from_login or self.username or "Test User"
            }
            response_pending = self.client.post("/api/booking/pending/pendingBookingToDB", json=confirm_data, name="/api/booking/pending/pendingBookingToDB")

            if response_pending.status_code == 200:
                try:
                    response_json = response_pending.json()
                    pending_booking_id = response_json.get('booking', {}).get('_id')
                    if pending_booking_id:
                        print(f"User {self.username}: Successfully saved pending booking to DB. Booking ID: {pending_booking_id}")
                        # Clear rejected timeslots for this court/date as a booking was successful
                        cache_key = (self.selected_center_id, self.selected_court_id, self.shared_date)
                        if cache_key in self.rejected_timeslots_cache:
                            del self.rejected_timeslots_cache[cache_key]

                        # Step 3: Confirm final booking (to processing)
                        print(f"User {self.username}: Attempting to confirm final booking ID: {pending_booking_id}")
                        confirm_final_data = {
                            "userId": self.user_id_from_login or FIXED_USER_ID_FALLBACK,
                            "centerId": self.selected_center_id,
                            "date": self.shared_date,
                            "totalAmount": FIXED_TOTAL_AMOUNT,
                            "paymentImage": self.fixed_payment_image_base64,
                            "note": FIXED_NOTE
                        }
                        response_final = self.client.post("/api/booking/pending/bookedBookingInDB", json=confirm_final_data, name="/api/booking/pending/bookedBookingInDB")

                        if response_final.status_code == 200:
                            print(f"User {self.username}: Final booking confirmed successfully for ID: {pending_booking_id}.")
                            self.has_selected_timeslot = False # Reset for next booking cycle
                            self._reset_booking_context() # Reset context for next booking attempt
                            return # Full booking successful, exit task
                        else:
                            print(f"User {self.username}: Final booking confirmation failed for ID {pending_booking_id}: Status {response_final.status_code}. Response: {response_final.text}")
                            # If final confirmation fails, this timeslot might still be problematic.
                            # Add to rejected_timeslots_cache and try another booking attempt.
                            cache_key = (self.selected_center_id, self.selected_court_id, self.shared_date)
                            self.rejected_timeslots_cache.setdefault(cache_key, set()).add(selected_hour_for_booking)
                            continue # Continue to next full booking attempt (try a new timeslot)
                    else:
                        print(f"User {self.username}: pendingBookingToDB successful but no booking ID returned. Response: {response_pending.text}")
                        # Treat as failure for this attempt, add to rejected and try another timeslot
                        self.has_selected_timeslot = False
                        cache_key = (self.selected_center_id, self.selected_court_id, self.shared_date)
                        self.rejected_timeslots_cache.setdefault(cache_key, set()).add(selected_hour_for_booking)
                        continue # Continue to next full booking attempt (try a new timeslot)
                except Exception as e:
                        print(f"User {self.username}: Error parsing pendingBookingToDB response or getting booking ID: {e}. Response: {response_pending.text}")
                        self.has_selected_timeslot = False
                        cache_key = (self.selected_center_id, self.selected_court_id, self.shared_date)
                        self.rejected_timeslots_cache.setdefault(cache_key, set()).add(selected_hour_for_booking)
                        continue # Continue to next full booking attempt (try a new timeslot)
            else:
                print(f"User {self.username}: pendingBookingToDB failed with status code: {response_pending.status_code}. Response: {response_pending.text}")
                self.has_selected_timeslot = False
                # If pending save failed, add the timeslot to rejected_timeslots_cache and try again
                if "đã được đặt bởi người khác" in response_pending.text:
                    print(f"User {self.username}: Timeslot {selected_hour_for_booking} on court {self.selected_court_id} for {self.shared_date} already booked at DB save stage. Adding to rejected and trying another slot.")
                    cache_key = (self.selected_center_id, self.selected_court_id, self.shared_date)
                    self.rejected_timeslots_cache.setdefault(cache_key, set()).add(selected_hour_for_booking)
                    continue # Continue to next full booking attempt (try a new timeslot)
                else:
                    # For other errors, break out of the full booking attempt loop
                    print(f"User {self.username}: Unexpected error during pendingBookingToDB. Breaking out of booking attempts.")
                    break # Move to the next task iteration for this user

        # If we reach here, all full booking attempts failed for this task run.
        self.has_selected_timeslot = False # Ensure flag is reset
        print(f"User {self.username}: All full booking attempts failed for this run.")
        self._reset_booking_context() # Reset context for next booking attempt, even if all attempts failed


    @task(2)
    def get_pending_mapping(self):
        """Task: Lấy dữ liệu mapping timeslot từ DB (gửi GET)."""
        if not self.is_authenticated:
            return
        if not self.selected_center_id:
            print(f"User {self.username}: No center selected. Skipping get_pending_mapping.")
            return

        params = {
            "centerId": self.selected_center_id,
            "date": self.shared_date,
            "userId": self.user_id_from_login or FIXED_USER_ID_FALLBACK
        }
        response = self.client.get("/api/booking/pending/mapping", params=params, name="/api/booking/pending/mapping")
        if response.status_code != 200:
            print(f"User {self.username}: Get_pending_mapping failed with status code: {response.status_code}. Params: {params}. Response: {response.text}")

    @task(3)
    def get_my_pending_timeslots(self):
        """Task: Lấy các timeslot tạm thời đã chọn từ cache (gửi GET)."""
        if not self.is_authenticated:
            return
        if not self.selected_center_id:
            print(f"User {self.username}: No center selected. Skipping get_my_pending_timeslots.")
            return

        params = {
            "centerId": self.selected_center_id,
            "date": self.shared_date,
            "userId": self.user_id_from_login or FIXED_USER_ID_FALLBACK
        }
        response = self.client.get("/api/booking/pending/my-timeslots", params=params, name="/api/booking/pending/my-timeslots")
        if response.status_code != 200:
            print(f"User {self.username}: Get_my_pending_timeslots failed with status code: {response.status_code}. Params: {params}. Response: {response.text}")

    tasks = [
        book_and_confirm_court,
        get_pending_mapping,
        get_my_pending_timeslots,
    ]


    def on_start(self):
        print(f"User {self.environment.runner.user_count} starting.")

        try:
            test_user = user_queue.get_nowait()
            self.username = test_user["username"]
            self.password = test_user["password"]
            print(f"User {self.environment.runner.user_count}: Assigned account {self.username}")
        except queue.Empty:
            print(f"User {self.environment.runner.user_count}: No more test users available in the queue. Stopping user.")
            self.environment.runner.quit()
            return

        print(f"User {self.environment.runner.user_count} ({self.username}): Attempting login to {LOGIN_ENDPOINT}...")
        login_data = {
            "username": self.username,
            "password": self.password
        }
        headers = {'Content-Type': 'application/json'}

        try:
            response = self.client.post(LOGIN_ENDPOINT, data=json.dumps(login_data), headers=headers, name="/api/users/login")

            if response.status_code == 200:
                print(f"User {self.environment.runner.user_count} ({self.username}): Login request successful.")
                self.auth_token = response.cookies.get("token")
                if self.auth_token:
                    print(f"User {self.environment.runner.user_count} ({self.username}): Logged in successfully and received auth token cookie.")
                    self.is_authenticated = True
                    try:
                        response_json = response.json()
                        self.user_id_from_login = response_json.get('user', {}).get('_id')
                        self.user_name_from_login = response_json.get('user', {}).get('name')
                        if not self.user_id_from_login:
                            print(f"User {self.environment.runner.user_count} ({self.username}): Warning: User ID not found in login response data. Using fallback ID.")
                            self.user_id_from_login = FIXED_USER_ID_FALLBACK
                        if not self.user_name_from_login:
                            print(f"User {self.environment.runner.user_count} ({self.username}): Warning: User name not found in login response data. Using username as fallback.")
                            self.user_name_from_login = self.username
                    except Exception as e:
                        print(f"User {self.environment.runner.user_count} ({self.username}): Error parsing login response for user ID/Name: {e}. Using fallback IDs/Names.")
                        self.user_id_from_login = FIXED_USER_ID_FALLBACK
                        self.user_name_from_login = self.username
                else:
                    print(f"User {self.environment.runner.user_count} ({self.username}): Login successful but no 'token' cookie found in response!")
                    self.is_authenticated = False
            else:
                print(f"User {self.environment.runner.user_count} ({self.username}): Login failed! Status: {response.status_code}, Response: {response.text}")
                self.is_authenticated = False
                return

        except Exception as e:
            print(f"User {self.environment.runner.user_count} ({self.username}): User login encountered an error: {e}")
            self.is_authenticated = False
            return

        if self.is_authenticated:
            print(f"User {self.environment.runner.user_count} ({self.username}): Login successful. Attempting to fetch CSRF token from {CSRF_TOKEN_ENDPOINT}...")
            try:
                csrf_response = self.client.get(CSRF_TOKEN_ENDPOINT, name=CSRF_TOKEN_ENDPOINT)
                if csrf_response.status_code == 200:
                    try:
                        response_json = csrf_response.json()
                        self.csrf_token_value = response_json.get(CSRF_TOKEN_BODY_KEY)
                        if self.csrf_token_value:
                            print(f"User {self.environment.runner.user_count} ({self.username}): Successfully fetched CSRF token from body: {self.csrf_token_value[:5]}...")
                        else:
                            print(f"User {self.environment.runner.user_count} ({self.username}): Warning: CSRF token endpoint returned 200 but no '{CSRF_TOKEN_BODY_KEY}' key found in body.")
                            pass
                    except Exception as e:
                        print(f"User {self.environment.runner.user_count} ({self.username}): Error parsing CSRF token response body: {e}")
                        pass
                else:
                    print(f"User {self.environment.runner.user_count} ({self.username}): Failed to fetch CSRF token! Status: {csrf_response.status_code}, Response: {csrf_response.text}")
                    pass
            except Exception as e:
                print(f"User {self.environment.runner.user_count} ({self.username}): Error fetching CSRF token: {e}")
                pass

        # Initial context setup after login
        if self.is_authenticated:
            try:
                with open(BASE64_FILE_PATH, 'r') as f:
                    self.fixed_payment_image_base64 = f.read().strip()
            except FileNotFoundError:
                print(f"User {self.environment.runner.user_count} ({self.username}): File not found: {BASE64_FILE_PATH}. Using default Base64.")
                self.fixed_payment_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
            except Exception as e:
                print(f"User {self.environment.runner.user_count} ({self.username}): Error reading Base64 file: {e}. Using default.")
                self.fixed_payment_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

            # Call reset context for initial setup
            self._reset_booking_context()


    def _custom_post(self, url, data=None, json=None, **kwargs):
        headers = kwargs.get("headers", {})
        if self.csrf_token_value and "X-CSRF-Token" not in headers:
            headers["X-CSRF-Token"] = self.csrf_token_value
            kwargs["headers"] = headers
        return self._original_client_post(url, data=data, json=json, **kwargs)

    def _custom_put(self, url, data=None, json=None, **kwargs):
         headers = kwargs.get("headers", {})
         if self.csrf_token_value and "X-CSRF-Token" not in headers:
             headers["X-CSRF-Token"] = self.csrf_token_value
             kwargs["headers"] = headers
         return self._original_client_put(url, data=data, json=json, **kwargs)

    def _custom_delete(self, url, data=None, json=None, **kwargs):
         headers = kwargs.get("headers", {})
         if self.csrf_token_value and "X-CSRF-Token" not in headers:
             headers["X-CSRF-Token"] = self.csrf_token_value
             kwargs["headers"] = headers
         return self._original_client_delete(url, data=data, json=json, **kwargs)
