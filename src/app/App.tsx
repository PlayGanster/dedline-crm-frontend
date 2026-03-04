import "./styles/index.css";
import { routes } from "./providers/router/routes";
import Router from "./providers/router/Router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./providers/theme/ThemeProvider";
import { RealtimeProvider } from "@/shared/providers/realtime";
import { NotificationContainer } from "@/features/notification";
import { AuthInitProvider, useAuthInit } from "./providers/auth-init";
import AuthLoader from "./providers/auth-init/AuthLoader";

const AppContent = () => {
  const { isInitializing } = useAuthInit();

  if (isInitializing) {
    return <AuthLoader />;
  }

  return (
    <>
      <Router routes={routes} />
      <NotificationContainer />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <AuthInitProvider>
          <RealtimeProvider>
            <AppContent />
          </RealtimeProvider>
        </AuthInitProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
