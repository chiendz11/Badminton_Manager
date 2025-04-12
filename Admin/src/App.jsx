import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserManage from './pages/UserManage';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserManage />} />
      </Routes>
    </Router>
  );
}

export default App;