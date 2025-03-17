import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import './styles/global.css';
import BookingSchedule from './pages/Booking';
import PaymentPage from './pages/Payment';

function App() {
  return (
    <Router>
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
        <Route path="/booking" element={<BookingSchedule />} />
        <Route path="/payment" element={< PaymentPage/>} />
      </Routes>
    </Router>
  );
}

export default App;