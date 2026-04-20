import React, { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { Mail, Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/core/auth";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { HibpService } from "@/core/auth/services/HibpService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { useToast } from "@/shared/hooks/use-toast";

export default function LoginPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "/";
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await AuthService.signIn({ email, password });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "/";
      navigate(redirectTo, { replace: true });
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message || "Verifique suas credenciais e tente novamente",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      toast({ title: "Preencha nome, e-mail e senha", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // 🔒 Verificar senha contra vazamentos conhecidos (HIBP)
      try {
        const hibp = await HibpService.checkPassword(password);
        if (hibp.isPwned) {
          toast({
            title: "Senha comprometida",
            description: `Esta senha apareceu ${hibp.count.toLocaleString("pt-BR")} vez(es) em vazamentos de dados. Escolha uma senha diferente.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } catch {
        // Falha na API HIBP não bloqueia o cadastro
      }

      await AuthService.signUp({
        email,
        password,
        name,
        display_name: name,
        handle: handle.trim() || undefined,
      });
      toast({
        title: "Conta criada!",
        description: "Verifique seu e-mail para confirmar o cadastro.",
      });
      setIsSignUp(false);
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Digite seu e-mail primeiro", variant: "destructive" });
      return;
    }
    try {
      await AuthService.resetPassword(email);
      toast({
        title: "E-mail enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) handleSignUp();
    else handleLogin();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? "Conecte-se com o que acontece no seu bairro."
              : "Entre para ver o que está rolando na sua vizinhança."}
          </p>
        </div>

        {/* Social login — apenas no login */}
        {!isSignUp && (
          <>
            <div className="space-y-3">
              <Button variant="outline" className="w-full h-11 gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Entrar com Google
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>
          </>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Campos exclusivos do cadastro */}
          {isSignUp && (
            <>
              <div>
                <label htmlFor="name-input" className="sr-only">Nome completo</label>
                <Input
                  id="name-input"
                  type="text"
                  placeholder="Seu nome"
                  className="h-11"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="handle-input" className="sr-only">Nome de usuário</label>
                <Input
                  id="handle-input"
                  type="text"
                  placeholder="@seunome (opcional)"
                  className="h-11"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                  autoComplete="username"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email-input" className="sr-only">E-mail</label>
            <Input
              id="email-input"
              type="email"
              placeholder="Seu e-mail"
              className="h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <label htmlFor="password-input" className="sr-only">Senha</label>
            <Input
              id="password-input"
              type={showPassword ? "text" : "password"}
              placeholder={isSignUp ? "Crie uma senha (mín. 6 caracteres)" : "Sua senha"}
              className="h-11 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {!isSignUp && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-primary font-medium block ml-auto"
            >
              Esqueci minha senha
            </button>
          )}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <Mail className="h-4 w-4 mr-1" />
            }
            {isSignUp ? "Criar conta" : "Entrar com E-mail"}
          </Button>
        </form>

        {/* Termos — só no cadastro */}
        {isSignUp && (
          <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
            Ao criar sua conta, você concorda com nossos{" "}
            <a href="/termos" className="text-primary underline-offset-2 hover:underline">Termos de Uso</a>
            {" "}e{" "}
            <a href="/privacidade" className="text-primary underline-offset-2 hover:underline">Política de Privacidade</a>.
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {isSignUp ? "Já tem conta? " : "Não tem conta? "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-medium"
          >
            {isSignUp ? "Fazer login" : "Criar conta grátis"}
          </button>
        </p>
      </div>
    </div>
  );
}
