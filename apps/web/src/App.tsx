import { lazy, Suspense } from "react";
import { webMessages } from "@/I18n/Messages";
import { useLocale } from "@/I18n/UseLocale";
import { LoginPage } from "@/Session/LoginPage";
import { useSession } from "@/Session/UseSession";
import styles from "./App.module.css";

// The dashboard pulls in ECharts (~180 kB); lazy-load it so the login screen
// stays light and only authenticated users download the chart.
const DashboardPage = lazy(() =>
  import("@/Dashboard/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);

/** Session gate: loading spinner → login screen → dashboard. */
export function App() {
  const { locale, setLocale } = useLocale();
  const { state, setAuthenticated, setAnonymous } = useSession();

  const loading = (
    <div className={styles.loading} role="status">
      {webMessages(locale).states.loading}
    </div>
  );

  if (state.status === "loading") {
    return loading;
  }

  if (state.status === "anonymous") {
    return <LoginPage locale={locale} onLocaleChange={setLocale} onAuthenticated={setAuthenticated} />;
  }

  return (
    <Suspense fallback={loading}>
      <DashboardPage
        user={state.user}
        locale={locale}
        onLocaleChange={setLocale}
        onLoggedOut={setAnonymous}
      />
    </Suspense>
  );
}
