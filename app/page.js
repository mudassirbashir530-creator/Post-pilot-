import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Footer from '@/components/landing/Footer';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-900 text-slate-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-navy-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              P
            </div>
            <span className="text-xl font-bold text-white tracking-tight">PostPilot</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm font-semibold transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Landing Components */}
      <main className="flex-grow">
        <Hero />
        <Features />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
