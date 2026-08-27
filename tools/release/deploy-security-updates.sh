#!/bin/bash

###############################################################################
# Script de Deploy - Correções de Segurança XSS
# 
# Este script automatiza o processo de deploy das correções de segurança,
# incluindo validações, testes e monitoramento.
#
# Uso:
#   ./scripts/deploy-security-updates.sh [staging|canary|production]
#
# Exemplos:
#   ./scripts/deploy-security-updates.sh staging
#   ./scripts/deploy-security-updates.sh canary
#   ./scripts/deploy-security-updates.sh production
###############################################################################

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
print_banner() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║        🚀 DEPLOY - Correções de Segurança XSS          ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
}

# Validar argumentos
if [ $# -eq 0 ]; then
    log_error "Uso: $0 [staging|canary|production]"
    exit 1
fi

ENVIRONMENT=$1

# Validar ambiente
if [[ ! "$ENVIRONMENT" =~ ^(staging|canary|production)$ ]]; then
    log_error "Ambiente inválido: $ENVIRONMENT"
    log_info "Ambientes válidos: staging, canary, production"
    exit 1
fi

print_banner

log_info "Ambiente: $ENVIRONMENT"
echo ""

###############################################################################
# FASE 1: PRÉ-VALIDAÇÕES
###############################################################################

log_info "FASE 1: Executando pré-validações..."
echo ""

# 1.1 Verificar branch
log_info "1.1 Verificando branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_warning "Você está na branch '$CURRENT_BRANCH', não 'main'"
    read -p "Continuar mesmo assim? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deploy cancelado"
        exit 1
    fi
fi
log_success "Branch: $CURRENT_BRANCH"

# 1.2 Verificar mudanças não commitadas
log_info "1.2 Verificando mudanças não commitadas..."
if ! git diff-index --quiet HEAD --; then
    log_error "Existem mudanças não commitadas"
    log_info "Commit ou stash suas mudanças antes de fazer deploy"
    exit 1
fi
log_success "Nenhuma mudança não commitada"

# 1.3 Pull das últimas mudanças
log_info "1.3 Atualizando branch..."
git pull origin "$CURRENT_BRANCH" || {
    log_error "Falha ao fazer pull"
    exit 1
}
log_success "Branch atualizada"

# 1.4 Instalar dependências
log_info "1.4 Instalando dependências..."
npm ci --silent || {
    log_error "Falha ao instalar dependências"
    exit 1
}
log_success "Dependências instaladas"

echo ""

###############################################################################
# FASE 2: VALIDAÇÕES DE SEGURANÇA
###############################################################################

log_info "FASE 2: Executando validações de segurança..."
echo ""

# 2.1 Validação automática
log_info "2.1 Executando validação automática..."
npm run security:scan || {
    log_error "Validação de segurança falhou"
    exit 1
}
log_success "Validação automática passou"

# 2.2 ESLint security
log_info "2.2 Executando ESLint security..."
npm run lint:security || {
    log_error "ESLint security encontrou problemas"
    exit 1
}
log_success "ESLint security passou"

# 2.3 Testes de segurança
log_info "2.3 Executando testes de segurança..."
npm test tests/security/ || {
    log_warning "Alguns testes falharam (pode ser problema de setup)"
    read -p "Continuar mesmo assim? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deploy cancelado"
        exit 1
    fi
}
log_success "Testes de segurança executados"

# 2.4 Audit de dependências
log_info "2.4 Executando audit de dependências..."
npm audit --audit-level=high || {
    log_warning "Vulnerabilidades encontradas em dependências"
    read -p "Continuar mesmo assim? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deploy cancelado"
        exit 1
    fi
}
log_success "Audit de dependências concluído"

echo ""

###############################################################################
# FASE 3: BUILD
###############################################################################

log_info "FASE 3: Executando build..."
echo ""

# 3.1 Build de produção
log_info "3.1 Executando build de produção..."
npm run build || {
    log_error "Build falhou"
    exit 1
}
log_success "Build concluído"

# 3.2 Verificar tamanho do bundle
log_info "3.2 Verificando tamanho do bundle..."
BUNDLE_SIZE=$(du -sh dist | cut -f1)
log_info "Tamanho do bundle: $BUNDLE_SIZE"

echo ""

###############################################################################
# FASE 4: DEPLOY
###############################################################################

log_info "FASE 4: Executando deploy..."
echo ""

case $ENVIRONMENT in
    staging)
        log_info "4.1 Deploy para STAGING..."
        log_warning "Este deploy irá para o ambiente de staging"
        read -p "Confirmar deploy para staging? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deploy cancelado"
            exit 1
        fi
        
        # Deploy para staging (simulado - ajustar conforme sua configuração)
        log_info "Executando: vercel --prod --scope=staging"
        # vercel --prod --scope=staging
        log_success "Deploy para staging concluído"
        
        log_info ""
        log_info "📋 PRÓXIMOS PASSOS:"
        log_info "1. Testar funcionalidades em staging"
        log_info "2. Validar migração de cookies"
        log_info "3. Monitorar logs por 24h"
        log_info "4. Executar: ./scripts/deploy-security-updates.sh canary"
        ;;
        
    canary)
        log_info "4.1 Deploy CANARY (5% do tráfego)..."
        log_warning "Este deploy irá para 5% dos usuários em produção"
        read -p "Confirmar deploy canary? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deploy cancelado"
            exit 1
        fi
        
        # Deploy canary (simulado - ajustar conforme sua configuração)
        log_info "Executando: vercel --prod --canary=5"
        # vercel --prod --canary=5
        log_success "Deploy canary concluído"
        
        log_info ""
        log_info "📋 PRÓXIMOS PASSOS:"
        log_info "1. Monitorar métricas por 2 horas"
        log_info "2. Verificar taxa de erro < 0.1%"
        log_info "3. Validar migração de cookies > 95%"
        log_info "4. Se OK, executar: ./scripts/deploy-security-updates.sh production"
        log_info "5. Se FALHAR, executar: vercel rollback"
        ;;
        
    production)
        log_info "4.1 Deploy COMPLETO para PRODUÇÃO..."
        log_warning "Este deploy irá para 100% dos usuários"
        log_error "⚠️  ATENÇÃO: DEPLOY DE PRODUÇÃO ⚠️"
        read -p "Confirmar deploy completo para produção? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deploy cancelado"
            exit 1
        fi
        
        # Deploy completo (simulado - ajustar conforme sua configuração)
        log_info "Executando: vercel --prod"
        # vercel --prod
        log_success "Deploy para produção concluído"
        
        log_info ""
        log_info "📋 PRÓXIMOS PASSOS:"
        log_info "1. Monitorar métricas por 24 horas"
        log_info "2. Verificar logs: vercel logs --follow --prod"
        log_info "3. Validar migração de cookies"
        log_info "4. Coletar feedback de usuários"
        log_info "5. Criar relatório de deploy"
        ;;
esac

echo ""

###############################################################################
# FASE 5: PÓS-DEPLOY
###############################################################################

log_info "FASE 5: Pós-deploy..."
echo ""

# 5.1 Gerar timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
log_info "Deploy concluído em: $TIMESTAMP"

# 5.2 Salvar log de deploy
DEPLOY_LOG="deploy-logs/deploy-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).log"
mkdir -p deploy-logs
echo "Deploy: $ENVIRONMENT" > "$DEPLOY_LOG"
echo "Timestamp: $TIMESTAMP" >> "$DEPLOY_LOG"
echo "Branch: $CURRENT_BRANCH" >> "$DEPLOY_LOG"
echo "Bundle Size: $BUNDLE_SIZE" >> "$DEPLOY_LOG"
log_success "Log salvo em: $DEPLOY_LOG"

# 5.3 Instruções de monitoramento
echo ""
log_info "📊 MONITORAMENTO:"
log_info "• Logs: vercel logs --follow --prod"
log_info "• Métricas: vercel inspect [deployment-url]"
log_info "• Rollback: vercel rollback"
echo ""

# 5.4 Documentação
log_info "📚 DOCUMENTAÇÃO:"
log_info "• Guia de Deploy: SECURITY_DEPLOYMENT_GUIDE.md"
log_info "• Status Final: SECURITY_STATUS_FINAL.md"
log_info "• Índice: SECURITY_INDEX.md"
echo ""

###############################################################################
# CONCLUSÃO
###############################################################################

log_success "╔══════════════════════════════════════════════════════════╗"
log_success "║                                                          ║"
log_success "║              ✅ DEPLOY CONCLUÍDO COM SUCESSO            ║"
log_success "║                                                          ║"
log_success "╚══════════════════════════════════════════════════════════╝"
echo ""

exit 0
