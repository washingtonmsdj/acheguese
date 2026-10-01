import { ArrowRight, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NearbyBusinessCtaProps {
  businessUrl: string;
}

export function NearbyBusinessCta({ businessUrl }: NearbyBusinessCtaProps) {
  const navigate = useNavigate();

  return (
    <section className="nb-business-cta">
      <Store />
      <div>
        <strong>Seu negócio aparece aqui?</strong>
        <p>Cadastre sua empresa e seja encontrado por quem está perto.</p>
      </div>
      <button type="button" onClick={() => navigate(businessUrl)}>
        Saiba mais <ArrowRight />
      </button>
    </section>
  );
}
