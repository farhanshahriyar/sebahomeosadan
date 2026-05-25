"use client";
import { useState } from "react";
import AddUserModal from "./AddUserModal";

export default function AddUserButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        className="btn btn-primary btn-compact" 
        onClick={() => setIsModalOpen(true)}
      >
        <i className="fas fa-user-plus"></i> Add User
      </button>
      
      {isModalOpen && <AddUserModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
