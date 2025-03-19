import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <h2 className="text-xl font-bold mb-4">Admin Menu</h2>
      <ul>
        <li className="mb-2"><Link to="/dashboard">Dashboard</Link></li>
        <li className="mb-2"><Link to="/users">Manage Users</Link></li>
        <li className="mb-2"><Link to="/fields">Manage Fields</Link></li>
      </ul>
    </aside>
  );
};

export default Sidebar;