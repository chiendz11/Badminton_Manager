import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./pages/Register";
import BookingSchedule from "./pages/Booking";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookingSchedule/>} />
      </Routes>
    </Router>
  );
}

export default App;
  