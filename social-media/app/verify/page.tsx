import { Suspense } from "react";
import VerifyForm from "./verifyform";

export default function VerifyPage() {
  return (
    <main>
      <h1>Verifikasi Email</h1>
      <p>Masukkan kode 6 digit yang dikirim ke email kamu.</p>

      <Suspense>
        <VerifyForm />
      </Suspense>
    </main>
  );
}