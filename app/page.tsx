import Link from 'next/link';
import { Zap, BarChart3, Clock, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 text-lg gradient-text">SwiftKDS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="nav-item text-sm">Sign In</Link>
            <Link
              href="/dashboard"
              className="btn-glow px-4 py-2 rounded-lg text-sm font-semibold text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-24">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 text-sm text-violet-400 mb-8 animate-fade-in">
            <Zap className="w-3.5 h-3.5" />
            <span>Built for Salons & Food Trucks</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
            Mission Control for<br />
            <span className="gradient-text">Your Business</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 animate-slide-up">
            SwiftKDS combines smart booking, real-time kitchen display, live GPS tracking,
            and Stripe payments into one seamless platform — built for both salons and food trucks.
          </p>

          <div className="flex items-center justify-center gap-4 animate-slide-up">
            <Link
              href="/dashboard"
              className="btn-glow px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2"
            >
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book/demo"
              className="glass-card px-6 py-3 rounded-xl text-sm font-semibold hover:border-violet-500/30 transition-colors"
            >
              See Demo Booking
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <BarChart3 className="w-5 h-5 text-violet-400" />,
                title: 'KDS Real-Time',
                description: 'Live kitchen display with Kanban board and countdown timers.',
              },
              {
                icon: <Clock className="w-5 h-5 text-blue-400" />,
                title: 'Smart Booking',
                description: 'Sequential scheduling for salons, slot-throttled for food trucks.',
              },
              {
                icon: <MapPin className="w-5 h-5 text-emerald-400" />,
                title: 'Live GPS',
                description: 'Food trucks broadcast their real-time location to customers.',
              },
              {
                icon: <Zap className="w-5 h-5 text-amber-400" />,
                title: 'Stripe Terminal',
                description: 'Tap to Pay on iPhone and Android with instant haptic feedback.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card p-5 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-display font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-sm text-zinc-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <CheckCircle2 className="w-4 h-4 text-violet-500" />
            Powered by <span className="text-violet-400 font-medium">SwiftKDS</span>,
            a <span className="text-white font-medium">Valdez & Co.</span> product
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-600">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
            <Link href="/support" className="hover:text-zinc-400 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
