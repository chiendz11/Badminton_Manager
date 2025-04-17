import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserManage from './pages/UserManage';
import Login from './pages/Login';
import AdminBillList from './pages/BillManage';
import CreateFixedBooking from './pages/CreateFixedBooking';
import CourtStatusPage from './pages/centerStatus';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/users-manage" element={<UserManage />} />
        <Route path="/admin-bill-list" element={<AdminBillList />} />
        <Route path="/create-fixed-booking" element={<CreateFixedBooking />} />
        <Route path="/center-status" element={<CourtStatusPage />} />
      </Routes>
    </Router>
  );
}

export default App;