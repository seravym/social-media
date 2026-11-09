import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="signup-page">
      <Link href="/login" className="signup-link">Back</Link>

      <h1>Create Account</h1>
      <p>Join us and stay updated with news all around the world</p>

      <form className="signup-form">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Username"
          className="signup-input"
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          className="signup-input"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          className="signup-input"
          minLength={8}
          required
        />

        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          className="signup-input"
          minLength={8}
          required
        />

        <button type="submit" className="signup-button">
          Create account
        </button>
      </form>

      <p>
        Already have an account?{" "}
        <Link href="/login" className="signup-link">Login!</Link>
      </p>
    </main>
  );
}