import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="auth-shell"><div className="auth-decoration"><div className="auth-glow" /><span className="auth-leaf">✳</span><p>“Clarity comes from knowing where you are.”</p><small>A little more at ease, every day.</small></div>
    <section className="auth-panel"><Link href="/" className="brand auth-brand"><span className="brand-mark">m</span> money trail</Link><div className="auth-content"><Link href="/" className="back-link"><ArrowLeft size={14} /> Back home</Link><h1>{title}</h1><p className="auth-description">{description}</p>{children}</div><p className="auth-privacy">Your financial details stay private and secure.</p></section>
  </main>;
}
