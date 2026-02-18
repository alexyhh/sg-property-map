import { Link } from 'react-router-dom';
import { Map, Layers, BarChart3, Check, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Map,
    title: 'Interactive Heatmap',
    description:
      'Explore HDB resale prices on an interactive colour-coded map. Instantly see which neighbourhoods are heating up or cooling down.',
  },
  {
    icon: Layers,
    title: 'Multi-Layer Views',
    description:
      'Switch between planning areas, postal districts, and individual land plots. Drill down from macro trends to street-level data.',
  },
  {
    icon: BarChart3,
    title: 'Price Analytics',
    description:
      'Track median prices, PSF trends, and transaction volumes over time. Export data to CSV for your own analysis.',
  },
];

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Get started with basic insights',
    features: [
      'Planning area heatmap',
      'Last 12 months of data',
      'Average PSF metric',
      '3 recent transactions',
    ],
    cta: 'Get Started',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'S$29',
    period: '/mo',
    description: 'Full access for serious property watchers',
    features: [
      'All map layers (district + land plot)',
      'All time ranges (3m to 5y)',
      'All metrics (PSF, median, volume)',
      'Full transaction history',
      'Flat type filter',
      'CSV export',
      'Watchlist (10 areas)',
      'YoY price trend chart',
    ],
    cta: 'Start 14-Day Free Trial',
    href: '/signup',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For teams and agencies',
    features: [
      'Everything in Pro',
      'API access',
      'Unlimited watchlists',
      'Team collaboration',
      'Priority support',
      'Custom data feeds',
    ],
    cta: 'Contact Us',
    href: '/signup',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-y-auto" style={{ overflow: 'auto', height: '100vh' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold tracking-tight">SG Property Map</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Updated with latest HDB data
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            Singapore&apos;s HDB Resale Market,{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Visualised
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Visualise HDB resale prices across Singapore&apos;s planning areas, postal districts,
            and individual land plots. Make smarter property decisions with interactive heatmaps
            and real transaction data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-base"
            >
              Start Exploring Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors text-base"
            >
              Sign In
            </Link>
          </div>

          {/* Hero visual placeholder */}
          <div className="mt-16 relative mx-auto max-w-3xl">
            <div className="aspect-video bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-2xl shadow-blue-900/20">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 text-blue-500/40 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm">Interactive map preview</p>
                </div>
              </div>
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to track HDB prices
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              From bird&apos;s-eye heatmaps to individual transaction records, we make property data accessible and actionable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-all hover:bg-slate-900/80"
              >
                <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Start free. Upgrade when you need deeper insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative p-6 rounded-xl border transition-all ${
                  tier.highlighted
                    ? 'bg-slate-800 border-blue-500/50 shadow-lg shadow-blue-900/20 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{tier.name}</h3>
                  <p className="text-slate-400 text-sm">{tier.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && (
                    <span className="text-slate-400 text-sm">{tier.period}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={tier.href}
                  className={`block w-full py-2.5 text-center text-sm font-semibold rounded-lg transition-colors ${
                    tier.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-sm">SG Property Map</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} SG Property Map. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
