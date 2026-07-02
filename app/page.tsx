import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="home-shell">
      <div className="home-inner">
        <section className="hero backdrop-grid">
          <span className="kicker">Globopersona backend</span>
          <h1 className="title">Supabase APIs with a sharp blue command surface.</h1>
          <p className="lead">
            Campaigns, contacts, dashboards, notifications, and settings are served from production-ready route handlers.
            The backend stays focused on data integrity while the front-end keeps the brand presentation crisp.
          </p>
          <div className="actions">
            <Link className="button primary" href="/api/health">Health check</Link>
            <Link className="button secondary" href="/api/dashboard/summary">Dashboard summary</Link>
          </div>
        </section>

        <section className="grid">
          <article className="card" style={{ gridColumn: 'span 7' }}>
            <span className="badge brand">API surface</span>
            <h2 style={{ marginTop: '14px' }}>Route handlers stay isolated and predictable.</h2>
            <p>
              The app router exposes typed endpoints for campaign orchestration, contact management, search, and workspace settings.
              Validation remains on the server so the frontend can stay lean.
            </p>
            <div className="routes">
              <div className="route"><code>/api/campaigns</code><span>CRUD + scheduling</span></div>
              <div className="route"><code>/api/contacts</code><span>Audience lifecycle</span></div>
              <div className="route"><code>/api/dashboard/summary</code><span>Executive metrics</span></div>
            </div>
          </article>

          <article className="card" style={{ gridColumn: 'span 5' }}>
            <span className="badge success">Healthy</span>
            <h3 style={{ marginTop: '14px' }}>Built for stable delivery.</h3>
            <p>
              Supabase auth, server-side request context, and Zod validation keep the backend aligned with the frontend without coupling UI concerns into the API layer.
            </p>
            <div className="metrics">
              <div className="metric">
                <span className="badge brand">Routes</span>
                <strong>20+</strong>
              </div>
              <div className="metric">
                <span className="badge brand">Schema</span>
                <strong>Strict</strong>
              </div>
              <div className="metric">
                <span className="badge brand">Auth</span>
                <strong>Supabase</strong>
              </div>
            </div>
          </article>

          <article className="card" style={{ gridColumn: 'span 12' }}>
            <span className="badge alert">Data guardrails</span>
            <p>
              The backend continues to own the source of truth for campaign, contact, notification, and analytics payloads. Frontend changes should not change the route contracts.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}