import { AuthFrame } from "@/components/auth-frame";
import { AuthForm } from "@/components/auth-form";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthFrame title="A fresh start." description="Make room for a clearer picture of your spending.">
    <AuthForm mode="signup" initialError={error} />
  </AuthFrame>;
}
