import { Navigate, useParams } from "react-router-dom";

export function CommunityCityEntryPage() {
  const { state = "ba", city = "salvador" } = useParams<{ state?: string; city?: string }>();

  if (state.toLowerCase() === "ba" && city.toLowerCase() === "salvador") {
    return <Navigate to="/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina" replace />;
  }

  return <Navigate to={`/${state}/${city}`} replace />;
}
