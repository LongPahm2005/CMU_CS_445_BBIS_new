import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 

const TEAL = "#1abc9c";
export default function Auth({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);

        if (data.success) {
          localStorage.setItem(
            "user",
            JSON.stringify(data.user)
          );

          localStorage.setItem(
            "isLoggedIn",
            "true"
          );
          localStorage.setItem(
            "token",
            data.token
          );
          setIsAuthenticated(true);
          navigate("/dashboard");
        } else {
          setError(data.message || "Login failed");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setError("Server error");
      })
      .finally(() => {
        setLoading(false);
      });
  };


  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{ backgroundColor: "#eef0f3" }}
    >
      {/* Card */}
      <div
        className="d-flex shadow"
        style={{
          width: "900px",
          minHeight: "560px",
          borderRadius: "1.25rem",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT: form ── */}
        <div
          className="bg-white d-flex flex-column justify-content-center"
          style={{ width: "50%", padding: "4rem 4rem" }}
        >
          <h2
            className="text-center fw-bold mb-4"
            style={{ fontFamily: "Georgia, serif", color: "#111", fontSize: "2rem" }}
          >
            Sign In
          </h2>

          {error && (
            <p className="text-danger text-center small mb-3">{error}</p>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-control mb-3"
              style={{
                backgroundColor: "#f2f2f2",
                border: "none",
                borderRadius: "0.4rem",
                padding: "0.85rem 1rem",
                fontSize: "0.95rem",
                color: "#555",
                boxShadow: "none",
                height: "3rem",
              }}
            />

            {/* Password */}
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="form-control mb-4"
              style={{
                backgroundColor: "#f2f2f2",
                border: "none",
                borderRadius: "0.4rem",
                padding: "0.85rem 1rem",
                fontSize: "0.95rem",
                color: "#555",
                boxShadow: "none",
                height: "3rem",
              }}
            />

            {/* Submit */}
            <div className="d-flex flex-column align-items-center">
              <button
                type="submit"
                disabled={loading}
                className="btn text-white fw-semibold px-5 mb-3"
                style={{
                  backgroundColor: TEAL,
                  border: "none",
                  borderRadius: "0.4rem",
                  fontSize: "0.9rem",
                  letterSpacing: "0.09em",
                  padding: "0.65rem 2rem",
                }}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  "SIGN IN"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── RIGHT: welcome ── */}
        <div
          className="d-flex flex-column align-items-center justify-content-center text-white text-center"
          style={{
            width: "50%",
            backgroundColor: TEAL,
            padding: "2.5rem",
            borderRadius: "0 1.25rem 1.25rem 0",
          }}
        >
          <h2
            className="fw-bold mb-3"
            style={{ fontFamily: "Georgia, serif", fontSize: "2rem" }}
          >
            Hello, Friend!
          </h2>
          <p style={{ fontSize: "0.95rem", opacity: 0.88, marginBottom: 0 }}>
            Please login to access dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
