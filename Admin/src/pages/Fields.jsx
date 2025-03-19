import React from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const Fields = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        <Navbar />
        <h2 className="text-2xl font-bold">Manage Fields</h2>
        <p>List of available badminton courts will be displayed here.</p>
        <Footer />
      </div>
    </div>
  );
};

export default Fields;