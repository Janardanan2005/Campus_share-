import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const { loginUser, busyAction } = useOutletContext();
  const [data, setData] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      email: data.email.trim().toLowerCase(),
      password: data.password.trim(),
    };

    if (!payload.email || !payload.password) {
      setFormError("Enter both your email and password.");
      return;
    }

    setFormError("");
    const result = await loginUser(payload);

    if (result.ok) {
      navigate("/");
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-stage">
        <div className="auth-brand-panel">
          <div className="auth-brand-mark">CS</div>
          <div className="auth-brand-copy">
            <span className="auth-mini-label">CampusShare</span>
            <h1>Student exchange, rebuilt with a cleaner flow.</h1>
          </div>
          <div className="auth-orbit-grid">
            <div className="auth-orbit-card">
              <strong>Share</strong>
              <span>Post what you can lend or sell.</span>
            </div>
            <div className="auth-orbit-card">
              <strong>Request</strong>
              <span>Track interest without losing context.</span>
            </div>
            <div className="auth-orbit-card accent">
              <strong>Move faster</strong>
              <span>One login and you are back in the feed.</span>
            </div>
          </div>
        </div>
        <div className="auth-panel auth-panel-spotlight">
          <div className="auth-panel-header">
            <span className="auth-mini-label">Welcome back</span>
            <h2>Sign in</h2>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            {formError ? <p className="field-error">{formError}</p> : null}
            <input
              type="email"
              placeholder="Email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              required
              autoComplete="current-password"
            />
            <button type="submit" disabled={busyAction === "login"}>
              {busyAction === "login" ? "Logging in..." : "Login"}
            </button>
          </form>
          <p className="auth-switch">
            No account yet? <Link className="text-link" to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
