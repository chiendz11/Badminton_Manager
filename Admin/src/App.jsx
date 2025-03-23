import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CenterStatus from './pages/centerStatus';



function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/ava"
          element={
            <>
              <Header />
              <Home />
              <Footer />
            </>
          }
        />
        <Route path="/" element={<CenterStatus />} />
      </Routes>
    </Router>
  );
}

export default App;