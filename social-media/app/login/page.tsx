import Link from "next/link";
import LoginForm from "./loginform";

export default function LoginPage() {
  return (
    <main>
      <h1>Get Started!</h1>
      <p>Stay updated with news all around the world</p>

      <LoginForm />

      <p>
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </p>
    </main>
  );
}