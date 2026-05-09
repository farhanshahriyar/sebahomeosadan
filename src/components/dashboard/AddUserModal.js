"use client";
import { useState } from "react";
import { createUserAction } from "@/app/dashboard/admin/actions";

export default function AddUserModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.target);
    const result = await createUserAction(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New User</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        
        {success ? (
          <div className="success-message" style={{ padding: '20px', color: 'green', textAlign: 'center' }}>
            User created successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="full_name" required placeholder="Dr. John Doe" />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" required placeholder="doctor@example.com" />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  required 
                  placeholder="Minimum 6 characters" 
                  minLength={6} 
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Role</label>
              <select name="role" required>
                <option value="author">Author (Can manage own posts)</option>
                <option value="admin">Admin (Can manage site content)</option>
                <option value="super_admin">Super Admin (Can manage users & content)</option>
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--primary-dark);
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          font-size: 14px;
        }
        .form-group input, .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: inherit;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
        }
        .btn-secondary {
          background: #f1f1f1;
          color: #333 !important;
          border: 1px solid #ddd;
        }
        .btn-secondary:hover {
          background: #e1e1e1;
        }
      `}</style>
    </div>
  );
}
