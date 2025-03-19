import React from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const Users = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        <Navbar />
        <h2 className="text-2xl font-bold">Manage Users</h2>
        <p>List of registered users will be displayed here.</p>
        <Footer />
      </div>
    </div>
  );
};

export default Users;