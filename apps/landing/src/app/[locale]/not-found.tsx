import Link from "next/link";

// In-app fallback. The user-facing 404 for the static site is `public/404.html`
// (served by nginx via `error_page 404 /404.html`), because with the root
// layout under `[locale]` Next no longer reliably emits `out/404.html`.
function NotFound() {
  return (
    <main style={{ padding: "6rem 1.5rem", textAlign: "center" }}>
      <h1 style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink)" }}>Page not found</h1>
      <p>
        <Link href="/en">Go to MooDuck</Link>
      </p>
    </main>
  );
}

export default NotFound;
