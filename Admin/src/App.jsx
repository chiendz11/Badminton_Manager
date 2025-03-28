import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminBillView from './pages/AdminBillView';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminBillView />} />
      </Routes>
    </Router>
  );
}

export default App;