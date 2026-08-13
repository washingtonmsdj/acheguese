import { AppRuntime } from "@/app/components/AppRuntime";
import { BootstrapErrorBoundary } from "@/app/components/BootstrapErrorBoundary";
import "@/styles/accessibility.css";

const App = () => (
  <BootstrapErrorBoundary>
    <AppRuntime />
  </BootstrapErrorBoundary>
);

export default App;
