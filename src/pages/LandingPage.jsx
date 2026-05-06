import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Redirect } from "wouter";
import { Show } from "@clerk/react";
import {
  ArrowRight,
  Bell,
  Cable,
  ChartNoAxesCombined,
  FileText,
  Lock,
  PlugZap,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import "./LandingPage.css";

function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.16 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function Navbar({ basePath }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setScrolled(current > 50);
      setHidden(current > lastY.current && current > 120);
      lastY.current = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""} ${hidden ? "lp-nav--hidden" : ""}`}>
      <div className="lp-nav__inner">
        <Link href="/" className="lp-brand">
          <span className="lp-brand__mark">
            <img src={`${basePath}/logo.svg`} alt="TeamFlow" />
          </span>
          <span className="lp-brand__wordmark">TeamFlow</span>
        </Link>

        <nav className="lp-nav__links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#changelog">Changelog</a>
          <a href="#docs">Docs</a>
        </nav>

        <div className="lp-nav__actions">
          <Link href="/sign-in" className="lp-btn lp-btn--ghost lp-btn--linkish">
            Sign in
          </Link>
          <Link href="/sign-up" className="lp-btn lp-btn--primary lp-btn--linkish">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="lp-section lp-section--dark lp-hero">
      <div className="lp-hero__glow" />
      <div className="lp-hero__content lp-hero-load">
        <div className="lp-badge">
          <Sparkles className="lp-badge__dot" size={16} />
          Now in public beta
        </div>
        <h1 className="lp-hero__headline">
          Ship projects.
          <br />
          Not spreadsheets.
        </h1>
        <p className="lp-hero__subheadline">
          TeamFlow gives engineering teams a command center for tasks, priorities, and delivery
          without changing how you work.
        </p>
        <div className="lp-hero__actions">
          <Link href="/sign-up" className="lp-btn lp-btn--primary">
            Get started free <ArrowRight size={18} />
          </Link>
          <a href="#demo" className="lp-btn lp-btn--outline">
            Watch demo
          </a>
        </div>
        <div className="lp-hero__proof">
          No credit card required · Used by 2,400+ teams · Free forever plan
        </div>

        <div className="lp-hero__frame">
          <div className="lp-device" id="demo">
            <div className="lp-device__chrome">
              <span />
              <span />
              <span />
            </div>
            <div className="lp-device__body">
              <aside className="lp-device__sidebar">
                {["Dashboard", "Projects", "Sprints", "Team", "Releases"].map((item, index) => (
                  <div
                    key={item}
                    className={`lp-device__nav-item ${index === 1 ? "lp-device__nav-item--active" : ""}`}
                  >
                    {item}
                  </div>
                ))}
              </aside>

              <div className="lp-device__main">
                <div className="lp-device__topbar">
                  <div className="lp-device__title">Portfolio overview</div>
                  <div className="lp-device__topbar-action" />
                </div>

                <div className="lp-device__stats">
                  {[
                    ["48", "Tasks in motion"],
                    ["12", "Projects aligned"],
                    ["94%", "Delivery confidence"],
                  ].map(([value, label]) => (
                    <div key={label} className="lp-device__stat">
                      <div className="lp-device__stat-value">{value}</div>
                      <div className="lp-device__stat-label">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="lp-device__grid">
                  {[
                    ["Growth Site Refresh", "12 tasks · 3 blocked", "72%"],
                    ["Mobile Sprint 14", "9 tasks · 0 blocked", "88%"],
                    ["Design System v2", "16 tasks · 2 reviews", "54%"],
                    ["Developer Docs", "6 tasks · 1 owner", "91%"],
                  ].map(([title, meta, progress]) => (
                    <div key={title} className="lp-device__card">
                      <div className="lp-device__card-title">{title}</div>
                      <div className="lp-device__card-meta">{meta}</div>
                      <div className="lp-device__progress">
                        <span style={{ width: progress }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoStrip() {
  const logos = useMemo(
    () => ["Stripe", "Vercel", "Linear", "Notion", "Figma", "GitHub", "Ramp", "Retool"],
    [],
  );

  return (
    <section className="lp-section lp-section--dark lp-logo-strip">
      <div className="lp-container">
        <p className="lp-logo-strip__label">Trusted by teams at</p>
        <div className="lp-logo-strip__viewport">
          <div className="lp-logo-strip__track">
            {[...logos, ...logos].map((logo, index) => (
              <div key={`${logo}-${index}`} className="lp-logo-strip__logo">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ card }) {
  const ref = useReveal();

  return (
    <article ref={ref} className={`lp-bento-card lp-bento-card--${card.size} lp-reveal`}>
      <div className="lp-bento-card__icon">{card.icon}</div>
      <h3 className="lp-bento-card__title">{card.title}</h3>
      <p className="lp-bento-card__desc">{card.desc}</p>

      {card.key === "board" && (
        <div className="lp-board-preview">
          {[
            ["To Do", ["API auth polish", "Onboarding flow"]],
            ["In Progress", ["Dashboard analytics", "Mobile task states"]],
            ["Done", ["Design QA", "Billing copy"]],
          ].map(([title, tasks]) => (
            <div key={title} className="lp-board-preview__col">
              <div className="lp-board-preview__title">{title}</div>
              {tasks.map((task) => (
                <div key={task} className="lp-board-preview__task">
                  {task}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function Features() {
  const headRef = useReveal();
  const cards = [
    {
      key: "board",
      size: "large",
      icon: <PlugZap size={28} />,
      title: "Priority Board",
      desc: "Keep every active stream visible. High-signal tasks rise to the top, blockers stay unmistakable, and the team never wonders what ships next.",
    },
    {
      key: "team",
      size: "medium",
      icon: <Users size={28} />,
      title: "Team View",
      desc: "See ownership, availability, and handoff risk across your entire delivery surface without opening five separate tabs.",
    },
    {
      key: "analytics",
      size: "medium",
      icon: <ChartNoAxesCombined size={28} />,
      title: "Analytics",
      desc: "Turn velocity, completion rate, and overdue patterns into decisions your team can act on today.",
    },
    {
      key: "notifications",
      size: "small",
      icon: <Bell size={28} />,
      title: "Notifications",
      desc: "Stay informed when priorities shift, not every time someone sneezes in a task thread.",
    },
    {
      key: "integrations",
      size: "small",
      icon: <Cable size={28} />,
      title: "Integrations",
      desc: "Connect GitHub, Slack, and your release stack without forcing the team into a new ritual.",
    },
    {
      key: "permissions",
      size: "small",
      icon: <Lock size={28} />,
      title: "Permissions",
      desc: "Role-aware access keeps projects open to the right people and invisible to the wrong ones.",
    },
  ];

  return (
    <section className="lp-section lp-section--dark lp-features" id="features">
      <div className="lp-container">
        <div ref={headRef} className="lp-section-head lp-reveal">
          <div className="lp-section-label">Features</div>
          <h2 className="lp-section-title">Everything your team needs. Nothing it doesn&apos;t.</h2>
        </div>

        <div className="lp-bento">
          {cards.map((card) => (
            <FeatureCard key={card.key} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step }) {
  const ref = useReveal();

  return (
    <article ref={ref} className="lp-step lp-reveal">
      <div className="lp-step__number">{step.number}</div>
      <div className="lp-step__icon">{step.icon}</div>
      <h3 className="lp-step__title">{step.title}</h3>
      <p className="lp-step__desc">{step.desc}</p>
    </article>
  );
}

function HowItWorks() {
  const headRef = useReveal();
  const steps = [
    {
      number: "01",
      icon: <PlugZap size={28} />,
      title: "Connect your tools",
      desc: "Bring GitHub, Slack, docs, and delivery signals into one place so context stops leaking across tabs.",
    },
    {
      number: "02",
      icon: <FileText size={28} />,
      title: "Assign and prioritise",
      desc: "Give every task an owner, a signal, and a clear next step so the team can move without interpretation debt.",
    },
    {
      number: "03",
      icon: <Rocket size={28} />,
      title: "Ship on time",
      desc: "Track momentum across projects, catch risk early, and keep releases calm even when the work is not.",
    },
  ];

  return (
    <section className="lp-section lp-section--light lp-how">
      <div className="lp-container">
        <div ref={headRef} className="lp-section-head lp-reveal">
          <div className="lp-section-label lp-section-label--light">How it works</div>
          <h2 className="lp-section-title lp-section-title--light">Operational clarity without operational drag.</h2>
        </div>

        <div className="lp-steps">
          {steps.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ quote }) {
  const ref = useReveal();

  return (
    <article ref={ref} className="lp-quote lp-reveal">
      <div className="lp-quote__stars">★★★★★</div>
      <p className="lp-quote__text">{quote.quote}</p>
      <div className="lp-quote__author">
        <div className="lp-quote__avatar" style={{ background: quote.tone }}>
          {quote.initials}
        </div>
        <div>
          <div className="lp-quote__name">{quote.name}</div>
          <div className="lp-quote__role">{quote.role}</div>
        </div>
      </div>
    </article>
  );
}

function Testimonials() {
  const headRef = useReveal();
  const quotes = [
    {
      initials: "SC",
      tone: "linear-gradient(135deg, #7c5cff 0%, #4f8fff 100%)",
      quote:
        "We replaced three status rituals with one weekly review in TeamFlow. The product feels calm, precise, and built for people who care about shipping.",
      name: "Sarah Chen",
      role: "VP Product, Northstar",
    },
    {
      initials: "MW",
      tone: "linear-gradient(135deg, #00a6ff 0%, #3bc8ff 100%)",
      quote:
        "The best part is how little explanation it needs. Engineers know where to look, designers know what changed, and leadership can see risk without asking.",
      name: "Marcus Webb",
      role: "CTO, Interval",
    },
    {
      initials: "PN",
      tone: "linear-gradient(135deg, #0fbf8f 0%, #34d399 100%)",
      quote:
        "We onboarded a distributed team into a single workflow in two days. That almost never happens with project management software.",
      name: "Priya Nair",
      role: "Head of Delivery, Beacon",
    },
  ];

  return (
    <section className="lp-section lp-section--dark lp-testimonials">
      <div className="lp-container">
        <div ref={headRef} className="lp-section-head lp-reveal">
          <div className="lp-section-label">Testimonials</div>
          <h2 className="lp-section-title">What teams are saying.</h2>
        </div>

        <div className="lp-testimonials__grid">
          {quotes.map((quote) => (
            <TestimonialCard key={quote.name} quote={quote} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ annual, plan }) {
  const ref = useReveal();
  const price = plan.monthly === null ? "Custom" : annual ? plan.annual : plan.monthly;

  return (
    <article
      ref={ref}
      className={`lp-price-card lp-reveal ${plan.highlighted ? "lp-price-card--pro" : ""}`}
    >
      {plan.highlighted && <div className="lp-price-card__badge">Most popular</div>}
      <div className="lp-price-card__name">{plan.name}</div>
      <div className="lp-price-card__price">
        {price === "Custom" ? (
          <span className="amount">Custom</span>
        ) : (
          <>
            <span className="currency">$</span>
            <span className="amount">{price}</span>
            <span className="period">{price === 0 ? "forever" : "/mo"}</span>
          </>
        )}
      </div>
      <p className="lp-price-card__desc">{plan.desc}</p>
      <ul className="lp-price-card__features">
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <Link href="/sign-up" className={plan.ctaClass}>
        {plan.ctaLabel}
      </Link>
    </article>
  );
}

function Pricing() {
  const headRef = useReveal();
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      key: "free",
      name: "Free",
      monthly: 0,
      annual: 0,
      desc: "For small teams getting organised.",
      features: ["Up to 5 members", "3 active projects", "Core task workflows", "Essential reporting"],
      ctaLabel: "Get started free",
      ctaClass: "lp-btn lp-btn--outline-dark lp-price-card__cta",
    },
    {
      key: "pro",
      name: "Pro",
      monthly: 12,
      annual: 10,
      desc: "For teams that need velocity with visibility.",
      features: ["Unlimited members", "Unlimited projects", "Advanced analytics", "Admin roles", "Priority support"],
      ctaLabel: "Start free trial",
      ctaClass: "lp-btn lp-btn--primary lp-price-card__cta",
      highlighted: true,
    },
    {
      key: "enterprise",
      name: "Enterprise",
      monthly: null,
      annual: null,
      desc: "For organisations operating at scale.",
      features: ["Everything in Pro", "SSO & SAML", "Security review support", "Dedicated onboarding", "Custom contracts"],
      ctaLabel: "Contact sales",
      ctaClass: "lp-btn lp-btn--outline-dark lp-price-card__cta",
    },
  ];

  return (
    <section className="lp-section lp-section--light lp-pricing" id="pricing">
      <div className="lp-container">
        <div ref={headRef} className="lp-section-head lp-reveal">
          <div className="lp-section-label lp-section-label--light">Pricing</div>
          <h2 className="lp-section-title lp-section-title--light">Simple pricing that scales with trust.</h2>
          <div className="lp-pricing__toggle">
            <button type="button" className={!annual ? "is-active" : ""} onClick={() => setAnnual(false)}>
              Monthly
            </button>
            <button type="button" className={annual ? "is-active" : ""} onClick={() => setAnnual(true)}>
              Annual <span className="lp-pricing__save">save 20%</span>
            </button>
          </div>
        </div>

        <div className="lp-pricing__grid">
          {plans.map((plan) => (
            <PricingCard key={plan.key} annual={annual} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const ref = useReveal();
  return (
    <section className="lp-section lp-section--dark lp-final">
      <div className="lp-container">
        <div ref={ref} className="lp-final__panel lp-reveal">
          <h2 className="lp-final__headline">
            Your team&apos;s clarity
            <br />
            starts today.
          </h2>
          <div className="lp-final__cta">
            <Link href="/sign-up" className="lp-btn lp-btn--primary">
              Get started free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ basePath }) {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer__grid">
          <div>
            <div className="lp-brand">
              <span className="lp-brand__mark">
                <img src={`${basePath}/logo.svg`} alt="TeamFlow" />
              </span>
              <span className="lp-brand__wordmark">TeamFlow</span>
            </div>
            <p className="lp-footer__brand-copy">
              The command center for engineering teams who want calm execution and cleaner delivery decisions.
            </p>
            <div className="lp-footer__socials">
              <a href="https://x.com" aria-label="X">X</a>
              <a href="https://github.com" aria-label="GitHub">GH</a>
              <a href="https://linkedin.com" aria-label="LinkedIn">in</a>
            </div>
          </div>

          <div>
            <h3 className="lp-footer__heading">Product</h3>
            <div className="lp-footer__links">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#changelog">Changelog</a>
              <a href="#docs">Docs</a>
            </div>
          </div>

          <div>
            <h3 className="lp-footer__heading">Company</h3>
            <div className="lp-footer__links">
              <a href="#about">About</a>
              <a href="#blog">Blog</a>
              <a href="#careers">Careers</a>
              <a href="#contact">Contact</a>
            </div>
          </div>

          <div>
            <h3 className="lp-footer__heading">Legal</h3>
            <div className="lp-footer__links">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#security">Security</a>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-footer__bar">
        <span>© 2025 TeamFlow</span>
        <div className="lp-footer__bar-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>

      <Show when="signed-out">
        <div className="lp-page">
          <Navbar basePath={basePath} />
          <Hero />
          <LogoStrip />
          <Features />
          <HowItWorks />
          <Testimonials />
          <Pricing />
          <FinalCTA />
          <Footer basePath={basePath} />
        </div>
      </Show>
    </>
  );
}
