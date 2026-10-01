import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PublicBrandHeader } from "@/app/components/navigation/PublicBrandHeader";
import { ActiveProfileIdentity } from "@/shared/components/ActiveProfileIdentity";
import { LAUNCH_URLS } from "@/core/routing/config/territory";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import "@/index.css";

// Shared React chrome for legacy, local-only concept documents.
const mount = document.getElementById("business-preview-chrome");
if (mount) {
  createRoot(mount).render(
    <BrowserRouter>
      <div className="light pt-page">
        <PublicBrandHeader urls={LAUNCH_URLS} accountHref={ACCOUNT_PATHS.home} />
        <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6 xl:px-8">
          <ActiveProfileIdentity profile={{ id: "preview-business", displayName: "Perfil da empresa (demonstração)" }} />
        </div>
      </div>
    </BrowserRouter>,
  );
}
