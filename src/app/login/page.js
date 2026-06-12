"use client";
import { useState } from "react";
import { login } from "./actions";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    formData.set("redirect", redirectTo);

    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="login-error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">
            <i className="fas fa-envelope"></i> Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            <i className="fas fa-lock"></i> Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Signing in...
            </>
          ) : (
            <>
              <i className="fas fa-sign-in-alt"></i> Sign In
            </>
          )}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <i className="fas fa-leaf login-logo"></i>
          <h1>Popular Homeo Center</h1>
          <p>Dashboard Login</p>
        </div>

        <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>}>
          <LoginForm />
        </Suspense>

        <div className="login-footer">
          <a href="/">
            <i className="fas fa-arrow-left"></i> Back to website
          </a>
        </div>
      </div>
    </div>
  );
}
