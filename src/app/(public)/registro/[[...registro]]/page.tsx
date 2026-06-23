// src/app/(auth)/registro/[[...registro]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp path="/registro" />
    </div>
  );
}
