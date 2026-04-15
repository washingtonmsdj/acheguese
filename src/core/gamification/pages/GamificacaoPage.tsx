import {
  Award,
  TrendingUp,
  Target,
  Trophy,
  Star,
  Zap,
  Gift,
  Users,
  Crown,
  Sparkles,
} from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
// TODO: Estes componentes devem ser movidos para core/gamification ou core/community
// Por enquanto, mantém imports de modules (violações documentadas)
import {
  CommunityProfileCard,
  Leaderboard,
  BadgeGrid,
  UserLevelBadge,
} from '@/core/community';
import { useCommunityProfile } from "@/core/community/hooks/useCommunityProfile";
import { Link } from "react-router-dom";
import { LAUNCH_URLS } from "@/config/territory";

export default function GamificacaoPage() {
  const { profile, badges, stats, loading } = useCommunityProfile();

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Sistema de Gamificação</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Ganhe pontos, conquiste badges e suba no ranking participando
          ativamente da comunidade!
        </p>
      </div>

      {/* Meu Perfil Comunitário */}
      {!loading && profile && (
        <div className="mb-8 grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <CommunityProfileCard />
          </div>
          <div>
            <UserLevelBadge totalPoints={stats.total_points} size="lg" />
          </div>
        </div>
      )}

      <Tabs defaultValue="como-funciona" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="como-funciona">Como Funciona</TabsTrigger>
          <TabsTrigger value="acoes">Ações e Pontos</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        {/* Como Funciona */}
        <TabsContent value="como-funciona" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Como Funciona</h2>
            <p className="text-muted-foreground mb-6">
              O sistema de gamificação recompensa sua participação ativa na
              comunidade. Quanto mais você contribui, mais pontos ganha e mais
              badges conquista!
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">1. Participe</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Crie posts, comente, avalie, ajude outros membros da
                  comunidade.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">2. Ganhe Pontos</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cada ação vale pontos. Acumule pontos para subir no ranking.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">3. Conquiste Badges</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Badges são conquistados automaticamente ao atingir marcos
                  especiais.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Benefícios</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Destaque no ranking da comunidade
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Badges exclusivos no seu perfil
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Reconhecimento como membro ativo
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Mais visibilidade para suas contribuições
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Ações e Pontos */}
        <TabsContent value="acoes" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Ações e Pontos</h2>
            <p className="text-muted-foreground mb-6">
              Cada ação que você realiza na plataforma vale pontos. Veja quanto
              cada ação vale:
            </p>

            <div className="space-y-3">
              {[
                { action: "Criar post na comunidade", points: 10, icon: "📝" },
                { action: "Adicionar comentário", points: 5, icon: "💬" },
                { action: "Voto útil em comentário", points: 2, icon: "👍" },
                { action: "Escrever avaliação", points: 15, icon: "⭐" },
                { action: "Fazer recomendação", points: 8, icon: "🎯" },
                { action: "Participar de evento", points: 12, icon: "📅" },
                { action: "Criar empresa", points: 50, icon: "🏢" },
                { action: "Oferecer serviço", points: 30, icon: "🛠️" },
                {
                  action: "Completar corrida (motorista)",
                  points: 20,
                  icon: "🚗",
                },
                { action: "Completar perfil", points: 25, icon: "✅" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium">{item.action}</span>
                  </div>
                  <Badge variant="secondary" className="text-base font-bold">
                    +{item.points} pts
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Quanto mais você participa, mais
                pontos acumula! Seja ativo, ajude outros membros e contribua com
                conteúdo de qualidade.
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Badges e Conquistas</h2>
            <p className="text-muted-foreground mb-6">
              Badges são conquistados automaticamente ao atingir marcos
              especiais. Colecione todos e mostre seu compromisso com a
              comunidade!
            </p>

            <div className="space-y-6">
              {/* Badges de Nível */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Badges de Nível</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Conquistados automaticamente ao acumular pontos
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Membro Bronze",
                      description: "Nível Bronze alcançado",
                      icon: "🥉",
                      requirement: "0 pontos",
                      color: "#CD7F32",
                    },
                    {
                      name: "Membro Prata",
                      description: "Nível Prata alcançado",
                      icon: "🥈",
                      requirement: "100 pontos",
                      color: "#C0C0C0",
                    },
                    {
                      name: "Membro Ouro",
                      description: "Nível Ouro alcançado",
                      icon: "🥇",
                      requirement: "500 pontos",
                      color: "#FFD700",
                    },
                    {
                      name: "Membro Platina",
                      description: "Nível Platina alcançado",
                      icon: "💎",
                      requirement: "1000 pontos",
                      color: "#E5E4E2",
                    },
                    {
                      name: "Membro Diamante",
                      description: "Nível Diamante alcançado",
                      icon: "💎",
                      requirement: "5000 pontos",
                      color: "#B9F2FF",
                    },
                  ].map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                      style={{ borderColor: `${badge.color}40` }}
                    >
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-full text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-semibold mb-1"
                          style={{ color: badge.color }}
                        >
                          {badge.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {badge.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {badge.requirement}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges de Influencer */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Badges de Influencer</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Para membros mais influentes e reconhecidos
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Influencer da Comunidade",
                      description: "Mais de 100 seguidores e alta interação",
                      icon: "💫",
                      requirement: "Verificação manual",
                      color: "#E91E63",
                    },
                    {
                      name: "Celebridade Local",
                      description: "Reconhecido por toda a comunidade",
                      icon: "🌟",
                      requirement: "Verificação manual",
                      color: "#9C27B0",
                    },
                    {
                      name: "Formador de Opinião",
                      description: "Posts com alta taxa de engajamento",
                      icon: "🔥",
                      requirement: "Verificação manual",
                      color: "#FF5722",
                    },
                  ].map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                      style={{ borderColor: `${badge.color}40` }}
                    >
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-full text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-semibold mb-1"
                          style={{ color: badge.color }}
                        >
                          {badge.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {badge.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {badge.requirement}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges de Avaliação */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Badges de Avaliação</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Para usuários bem avaliados pela comunidade
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Top Avaliado",
                      description: "Entre os 10 usuários mais bem avaliados",
                      icon: "⭐",
                      requirement: "Top 10 ranking",
                      color: "#FFD700",
                    },
                    {
                      name: "Profissional 5 Estrelas",
                      description: "Mantém média 5.0 em avaliações",
                      icon: "🌟",
                      requirement: "Média 5.0",
                      color: "#FFD700",
                    },
                    {
                      name: "Altamente Recomendado",
                      description: "Mais de 50 avaliações positivas",
                      icon: "👍",
                      requirement: "50+ avaliações",
                      color: "#4CAF50",
                    },
                  ].map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                      style={{ borderColor: `${badge.color}40` }}
                    >
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-full text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-semibold mb-1"
                          style={{ color: badge.color }}
                        >
                          {badge.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {badge.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {badge.requirement}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges Automáticos Básicos */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Badges Automáticos</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Conquistados ao atingir marcos de participação
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Morador Verificado",
                      description: "Residência verificada pela administração",
                      icon: "🏠",
                      requirement: "Verificar residência",
                    },
                    {
                      name: "Vizinho Prestativo",
                      description: "Ajudou outros moradores 10+ vezes",
                      icon: "🤝",
                      requirement: "10 votos úteis",
                    },
                    {
                      name: "Membro Ativo",
                      description: "Mais de 50 interações na comunidade",
                      icon: "⭐",
                      requirement: "50 interações",
                    },
                    {
                      name: "Avaliador Confiável",
                      description: "Escreveu 5+ avaliações detalhadas",
                      icon: "✅",
                      requirement: "5 avaliações",
                    },
                    {
                      name: "Especialista em Avaliações",
                      description: "Mais de 100 avaliações escritas",
                      icon: "📝",
                      requirement: "100 avaliações",
                    },
                    {
                      name: "Criador de Conteúdo",
                      description: "Mais de 100 posts criados",
                      icon: "✍️",
                      requirement: "100 posts",
                    },
                    {
                      name: "Super Ajudante",
                      description: "Mais de 100 votos úteis recebidos",
                      icon: "🦸",
                      requirement: "100 votos úteis",
                    },
                  ].map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-2xl flex-shrink-0">
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1">{badge.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {badge.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {badge.requirement}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {badges.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Seus Badges Conquistados
                  </h3>
                  <BadgeGrid badges={badges} size="lg" />
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Ranking */}
        <TabsContent value="ranking" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Ranking da Comunidade
                </h2>
                <p className="text-muted-foreground">
                  Veja quem são os membros mais ativos da comunidade
                </p>
              </div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>

            <Leaderboard limit={10} />

            {stats.total_points > 0 && (
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Sua Pontuação
                    </p>
                    <p className="text-3xl font-bold">
                      {stats.total_points} pontos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Badges</p>
                    <p className="text-3xl font-bold">{stats.badges_count}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">
                  Dicas para Subir no Ranking
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Seja ativo: crie posts e comente regularmente</li>
                  <li>• Ajude outros: responda perguntas e dê votos úteis</li>
                  <li>• Avalie: escreva avaliações detalhadas e honestas</li>
                  <li>• Contribua: compartilhe conhecimento e experiências</li>
                  <li>• Participe: compareça em eventos da comunidade</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CTA */}
      <div className="mt-8 text-center">
        <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-2xl font-bold mb-2">
            Comece a Ganhar Pontos Agora!
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Participe ativamente da comunidade, ajude outros membros e conquiste
            seu lugar no ranking!
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild size="lg">
              <Link to={LAUNCH_URLS.community}>Ir para Comunidade</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/configuracoes">Configurar Perfil</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
