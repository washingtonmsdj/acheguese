import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { trackError } from "@/shared/utils/errorTracking";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    trackError(
      new Error("404 Error: User attempted to access non-existent route"),
      {
        component: "NotFound",
        action: "pageAccess",
        metadata: { pathname: location.pathname },
      },
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          Oops! Page not found
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
