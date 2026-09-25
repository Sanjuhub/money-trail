import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, ShieldCheck, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav wrap">
        <Link href="/" className="brand"><span className="brand-mark">m</span> money trail</Link>
        <div className="nav-actions"><Link href="/login" className="nav-login">Log in</Link><Link href="/signup" className="button button-dark button-small">Get started <ArrowRight size={15} /></Link></div>
      </nav>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A clearer view of your money</div>
          <h1>Your money,<br /><em>in good view.</em></h1>
          <p className="hero-text">Little purchases add up. Money Trail helps you see the whole picture, one thoughtful step at a time.</p>
          <div className="hero-actions"><Link href="/signup" className="button button-dark">Start your free account <ArrowRight size={16} /></Link><span className="quiet-note">No spreadsheets. No fuss.</span></div>
          <div className="hero-proof"><div className="proof-avatars"><span>A</span><span>M</span><span>S</span></div><span>A little more clarity, every day.</span></div>
        </div>
        <div className="hero-art" aria-label="Preview of an expense dashboard">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="preview-card">
            <div className="preview-top"><span className="tiny-label">YOUR SPENDING</span><span className="month-pill">This month⌄</span></div>
            <div className="preview-total">₹24,680<span>.00</span></div>
            <div className="preview-change"><span>↓ 12.8%</span> <small>vs. last month</small></div>
            <div className="preview-chart"><div className="chart-grid" /><svg viewBox="0 0 480 150" preserveAspectRatio="none" role="img" aria-label="Sample spending trend"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#99bd9e" stopOpacity=".35"/><stop offset="1" stopColor="#99bd9e" stopOpacity="0"/></linearGradient></defs><path d="M0 111 C32 98 39 110 67 91 S111 87 132 100 S163 75 194 82 S233 54 260 69 S291 51 321 63 S362 25 393 41 S437 28 480 12 L480 150 L0 150Z" fill="url(#fill)"/><path d="M0 111 C32 98 39 110 67 91 S111 87 132 100 S163 75 194 82 S233 54 260 69 S291 51 321 63 S362 25 393 41 S437 28 480 12" fill="none" stroke="#56785c" strokeWidth="3" strokeLinecap="round"/></svg></div>
            <div className="preview-days"><span>01</span><span>05</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span></div>
            <div className="preview-divider" />
            <div className="preview-bottom"><div className="mini-icon"><ChartNoAxesCombined size={15} /></div><div><b>You're finding your rhythm</b><small>Spending is down this month</small></div><span className="trend-up">↗</span></div>
          </div>
          <div className="floating-chip"><span className="chip-icon">✳</span><div><small>THIS WEEK</small><b>Looking good</b></div></div>
          <div className="floating-spark">✳</div>
        </div>
      </section>
      <section className="landing-bottom wrap"><div className="bottom-rule" /><div className="bottom-content"><span>SMALL STEPS. CLEARER PICTURE.</span><div className="feature-notes"><span><ChartNoAxesCombined size={15} /> See your patterns</span><span><ShieldCheck size={15} /> Just for your eyes</span><span><Sparkles size={15} /> Made to feel simple</span></div></div></section>
    </main>
  );
}
