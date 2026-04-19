import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, PieChart, Target, Shield, Zap, TrendingUp } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="px-6 h-20 flex items-center justify-between shadow-sm bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 text-primary font-bold text-2xl">
          <Wallet className="h-8 w-8" />
          FinTrack
        </div>
        <nav className="flex gap-4">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 px-6 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 dark:text-white">
            Take control of your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              financial future.
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            The intelligent way to track expenses, set budgets, and achieve your financial goals with the power of Machine Learning.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="h-14 px-8 text-lg font-medium">Start for free</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium">Sign in</Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16">Everything you need to master your money</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <PieChart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Budgets</h3>
                <p className="text-slate-600 dark:text-slate-400">Set limits and let us notify you before you overspend. Easily track running costs.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Anomaly Detection</h3>
                <p className="text-slate-600 dark:text-slate-400">Our Machine Learning models automatically flag unusual and suspicious expenses.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Expense Forecast</h3>
                <p className="text-slate-600 dark:text-slate-400">Predict next month's expenses per category so you can plan ahead effortlessly.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} FinTrack. All rights reserved.</p>
      </footer>
    </div>
  );
}
