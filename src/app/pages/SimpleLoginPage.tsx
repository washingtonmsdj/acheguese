import React, { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/core/auth/services/AuthService";
import { useAuth } from "@/core/auth/hooks/useAuth";

export default function SimpleLoginPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("🔄 Iniciando login...");
    console.log("📧 Email:", email);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: Login demorou mais de 10 segundos")), 10000);
      });

      await Promise.race([
        AuthService.signIn({ email, password }),
        timeoutPromise
      ]);

      console.log("✅ Login bem-sucedido!");

      // Aguardar um pouco para garantir que a sessão foi criada
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Recarregar a página para garantir que o SessionProvider pegue a sessão
      console.log("🔄 Redirecionando...");
      window.location.href = "/";

    } catch (err: any) {
      console.error("❌ Erro:", err);
      setError(err.message || "Erro ao fazer login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Login Simples</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Versão de debug
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Entrar
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>Teste com:</p>
          <p>washingtonmsdj@gmail.com / admin123</p>
          <p>ou</p>
          <p>teste@example.com / teste123</p>
        </div>
      </div>
    </div>
  );
}
