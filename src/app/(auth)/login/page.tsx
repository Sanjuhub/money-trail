import { AuthFrame } from "@/components/auth-frame";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; passwordUpdated?: string }> }) {
  const { error, passwordUpdated } = await searchParams;
  return <AuthFrame title="Welcome back." description="Your money picture is right where you left it.">
    <AuthForm mode="login" initialError={error} initialNotice={passwordUpdated ? "Password updated. Log in with your new password." : undefined} />
  </AuthFrame>;
}
