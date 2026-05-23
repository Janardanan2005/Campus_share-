import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const { registerUser, busyAction } = useOutletContext();
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    collegeId: "",
    year: "",
  });
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password.trim(),
      collegeId: data.collegeId.trim(),
      year: data.year.trim(),
    };

    if (!payload.name || !payload.email || !payload.password) {
      setFormError("Name, email, and password are required.");
      return;
    }

    if (payload.password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    setFormError("");
    const result = await registerUser(payload);

    if (result.ok) {
      navigate("/");
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <div className="auth-panel-header">
          <h2>Create account</h2>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          {formError ? <p className="field-error">{formError}</p> : null}
          <input
            placeholder="Name"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            required
            autoComplete="name"
          />
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
            minLength={6}
            autoComplete="new-password"
          />
          <input
            placeholder="College ID (optional)"
            value={data.collegeId}
            onChange={(e) => setData({ ...data, collegeId: e.target.value })}
          />
          <input
            placeholder="Year (optional)"
            value={data.year}
            onChange={(e) => setData({ ...data, year: e.target.value })}
          />
          <button type="submit" disabled={busyAction === "register"}>
            {busyAction === "register" ? "Creating..." : "Register"}
          </button>
        </form>
        <p className="auth-switch">
          Already registered? <Link className="text-link" to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
