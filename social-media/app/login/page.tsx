export default function LoginPage() {
  return (
    <main className="login-page">
      <h1>Get Started!</h1>
      <p>Stay updated with news all around the world</p>

      <button type="button" className="login-button">
        Login with Email
      </button>
      <button type="button" className="login-button">
        Login with Phone Number
      </button>

      <p>or</p>

      <label className="login-label">
        Login with Username
        <input type="text" name="username" placeholder="Username" className="login-input" />
      </label>

      <button type="button" className="login-button">
        Next
      </button>
    </main>
  );
}