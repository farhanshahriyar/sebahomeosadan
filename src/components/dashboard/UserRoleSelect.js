"use client";
import { useState, useTransition } from "react";
import { updateUserRoleAction } from "@/app/dashboard/admin/actions";

export default function UserRoleSelect({ userId, currentRole }) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState(currentRole);

  const handleChange = async (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole);
      if (res?.error) {
        alert(res.error);
        setRole(currentRole); // revert on error
      }
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <select 
        value={role} 
        onChange={handleChange} 
        disabled={isPending}
        style={{
          padding: '6px 10px',
          borderRadius: '6px',
          border: '1px solid #ddd',
          fontSize: '13px',
          background: isPending ? '#f5f5f5' : '#fff'
        }}
      >
        <option value="author">Author</option>
        <option value="admin">Admin</option>
        <option value="super_admin">Super Admin</option>
      </select>
      {isPending && <i className="fas fa-spinner fa-spin" style={{ color: '#0d7a3e' }}></i>}
    </div>
  );
}
