import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errorText } from "../api";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.status === 401 ? "Incorrect username or password." : errorText(err));
    }
  };

  return (
    <form className="auth-form" onSubmit={submit}>
      <h2>Welcome back</h2>
      <p className="muted">Log in to pick up where you left off.</p>
      {error && <p className="error">{error}</p>}
      <label>Username
        <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
      </label>
      <label>Password
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      </label>
      <button className="btn" type="submit">Log in</button>
      <p className="muted">No account? <Link to="/register">Create one</Link></p>
    </form>
  );
}
