import { useCallback } from "react";
import type { TLocale } from "@mooduck/core";
import type { TSessionUser } from "@mooduck/contracts";
import { authApi } from "@/Api/AuthApi";
import { webMessages } from "@/I18n/Messages";
import { AppHeader } from "./AppHeader/AppHeader";
import { CheckInCard } from "./CheckInCard/CheckInCard";
import { MoodChartCard } from "./MoodChartCard/MoodChartCard";
import { RecentCard } from "./RecentCard/RecentCard";
import { StatTiles } from "./StatTiles/StatTiles";
import { useDashboardController } from "./UseDashboardController";
import styles from "./DashboardPage.module.css";

interface DashboardPageProps {
  user: TSessionUser;
  locale: TLocale;
  onLocaleChange: (locale: TLocale) => void;
  onLoggedOut: () => void;
}

export function DashboardPage({ user, locale, onLocaleChange, onLoggedOut }: DashboardPageProps) {
  const messages = webMessages(locale);
  const dashboard = useDashboardController({ onUnauthorized: onLoggedOut });

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      onLoggedOut();
    }
  }, [onLoggedOut]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <AppHeader
          user={user}
          locale={locale}
          messages={messages}
          onLocaleChange={onLocaleChange}
          onLogout={handleLogout}
        />

        <CheckInCard
          messages={messages}
          saving={dashboard.saving}
          saveError={dashboard.saveError}
          onSubmit={dashboard.submitCheckIn}
        />

        <StatTiles
          messages={messages}
          average={dashboard.stats.average}
          count={dashboard.stats.count}
          streak={dashboard.streak}
          hasEntries={dashboard.entries.length > 0}
          loading={dashboard.loading}
        />

        <div className={styles.bottom}>
          <MoodChartCard
            messages={messages}
            locale={locale}
            entries={dashboard.entries}
            loading={dashboard.loading}
          />
          <RecentCard
            messages={messages}
            locale={locale}
            entries={dashboard.recent}
            loading={dashboard.loading}
            loadError={dashboard.loadError}
            onRetry={dashboard.reload}
          />
        </div>
      </div>
    </div>
  );
}
