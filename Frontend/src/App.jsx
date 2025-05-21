import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import './styles/global.css';
import BookingSchedule from './pages/Booking';
import News from './pages/News';
import PaymentPage from './pages/Payment';
import Centers from "./pages/Centers";
import Policy from "./pages/Policy";
import Contact from "./pages/Contact";
import Competition from "./pages/Competition";
import UserProfile from "./pages/UserProfile";
import Service from "./pages/Service";
import ResetPasswordPage from "./pages/ResetPassword";
import { AuthProvider } from './contexts/AuthContext';
import WeatherDisplay from './components/WeatherDisplay'; 
import Scroll from './components/Scroll'; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Scroll />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Header />
                <Home />
                <Footer />
              </>
            }
          />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/service" element={<Service />} />
          <Route path="/competition" element={<Competition />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/centers" element={<Centers />} />
          <Route path="/news" element={<News />} />
          <Route path="/booking" element={<BookingSchedule />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/reset-password/:token/:userId" element={<ResetPasswordPage />} />
        </Routes>
        <WeatherDisplay />
      </Router>
    </AuthProvider>
  );
}

export default App;