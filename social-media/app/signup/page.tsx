import Link from "next/link";
import SignupForm from "./signupform";

export default function SignupPage() {
  return (
    <main className="signup-page">
      <Link href="/login" className="signup-link">Back</Link>

      <h1>Create Account</h1>
      <p>Join us and stay updated with news all around the world</p>

      <SignupForm />

      <p>
        Already have an account?{" "}
        <Link href="/login" className="signup-link">Login!</Link>
      </p>
    </main>
  );
}