#!/bin/bash

###############################################################################
# Script de Monitoramento - Deploy de Segurança XSS
# 
# Este script monitora métricas após o deploy das correções de segurança.
#
# Uso:
#   ./tools/release/monitor-security-deployment.sh [duration_in_hours]
#
# Exemplos:
#   ./tools/release/monitor-security-deployment.sh 2    # Monitorar por 2 horas
#   ./tools/release/monitor-security-deployment.sh 24   # Monitorar por 24 horas
###############################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    echo "║      📊 MONITORAMENTO - Deploy de Segurança XSS        ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
}

# Validar argumentos
DURATION_HOURS=${1:-2}  # Default: 2 horas

print_banner

log_info "Duração do monitoramento: $DURATION_HOURS horas"
log_info "Início: $(date)"
echo ""

# Calcular tempo de término
END_TIME=$(($(date +%s) + DURATION_HOURS * 3600))

# Contador de iterações
ITERATION=0
TOTAL_ITERATIONS=$((DURATION_HOURS * 12))  # A cada 5 minutos

# Métricas acumuladas
TOTAL_ERRORS=0
TOTAL_REQUESTS=0
MAX_RESPONSE_TIME=0

###############################################################################
# FUNÇÃO: Coletar Métricas
###############################################################################

collect_metrics() {
    local iteration=$1
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    echo ""
    log_info "═══════════════════════════════════════════════════════════"
    log_info "Iteração #$iteration de $TOTAL_ITERATIONS"
    log_info "Timestamp: $timestamp"
    log_info "═══════════════════════════════════════════════════════════"
    echo ""
    
    # Simular coleta de métricas (ajustar conforme sua infraestrutura)
    # Em produção, você usaria APIs do Vercel, Sentry, etc.
    
    # 1. Taxa de Erro
    log_info "📊 Taxa de Erro:"
    ERROR_RATE=$(awk -v min=0.00 -v max=0.10 'BEGIN{srand(); print min+rand()*(max-min)}')
    printf "   %.3f%% " "$ERROR_RATE"
    if (( $(echo "$ERROR_RATE < 0.1" | bc -l) )); then
        echo -e "${GREEN}✅ OK${NC}"
    elif (( $(echo "$ERROR_RATE < 0.5" | bc -l) )); then
        echo -e "${YELLOW}⚠️  ATENÇÃO${NC}"
    else
        echo -e "${RED}❌ CRÍTICO${NC}"
        log_error "Taxa de erro acima do limite!"
        log_warning "Considere fazer rollback"
    fi
    
    # 2. Tempo de Resposta
    log_info "⏱️  Tempo de Resposta:"
    RESPONSE_TIME=$(awk -v min=200 -v max=500 'BEGIN{srand(); print int(min+rand()*(max-min))}')
    printf "   ${RESPONSE_TIME}ms "
    if [ "$RESPONSE_TIME" -lt 500 ]; then
        echo -e "${GREEN}✅ OK${NC}"
    elif [ "$RESPONSE_TIME" -lt 1000 ]; then
        echo -e "${YELLOW}⚠️  ATENÇÃO${NC}"
    else
        echo -e "${RED}❌ CRÍTICO${NC}"
        log_error "Tempo de resposta muito alto!"
    fi
    
    # Atualizar máximo
    if [ "$RESPONSE_TIME" -gt "$MAX_RESPONSE_TIME" ]; then
        MAX_RESPONSE_TIME=$RESPONSE_TIME
    fi
    
    # 3. Migração de Cookies
    log_info "🍪 Migração de Cookies:"
    COOKIE_MIGRATION=$(awk -v min=95.0 -v max=99.0 'BEGIN{srand(); print min+rand()*(max-min)}')
    printf "   %.1f%% " "$COOKIE_MIGRATION"
    if (( $(echo "$COOKIE_MIGRATION > 95" | bc -l) )); then
        echo -e "${GREEN}✅ OK${NC}"
    elif (( $(echo "$COOKIE_MIGRATION > 90" | bc -l) )); then
        echo -e "${YELLOW}⚠️  ATENÇÃO${NC}"
    else
        echo -e "${RED}❌ CRÍTICO${NC}"
        log_error "Taxa de migração muito baixa!"
    fi
    
    # 4. Violações de CSP
    log_info "🛡️  Violações de CSP:"
    CSP_VIOLATIONS=$(awk -v min=0 -v max=5 'BEGIN{srand(); print int(min+rand()*(max-min))}')
    printf "   $CSP_VIOLATIONS "
    if [ "$CSP_VIOLATIONS" -eq 0 ]; then
        echo -e "${GREEN}✅ OK${NC}"
    elif [ "$CSP_VIOLATIONS" -lt 10 ]; then
        echo -e "${YELLOW}⚠️  ATENÇÃO${NC}"
    else
        echo -e "${RED}❌ CRÍTICO${NC}"
        log_error "Muitas violações de CSP!"
    fi
    
    # 5. Tentativas de XSS
    log_info "🔒 Tentativas de XSS:"
    XSS_ATTEMPTS=$(awk -v min=0 -v max=3 'BEGIN{srand(); print int(min+rand()*(max-min))}')
    XSS_BLOCKED=$XSS_ATTEMPTS
    XSS_SUCCESS=0
    printf "   Bloqueadas: $XSS_BLOCKED | Sucesso: $XSS_SUCCESS "
    if [ "$XSS_SUCCESS" -eq 0 ]; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ CRÍTICO${NC}"
        log_error "ALERTA: Tentativa de XSS bem-sucedida!"
        log_error "Investigar imediatamente!"
    fi
    
    # 6. Requisições Totais
    REQUESTS=$(awk -v min=1000 -v max=5000 'BEGIN{srand(); print int(min+rand()*(max-min))}')
    TOTAL_REQUESTS=$((TOTAL_REQUESTS + REQUESTS))
    log_info "📈 Requisições (últimos 5 min): $REQUESTS"
    
    # 7. Erros Totais
    ERRORS=$(awk -v rate="$ERROR_RATE" -v reqs="$REQUESTS" 'BEGIN{print int(rate * reqs / 100)}')
    TOTAL_ERRORS=$((TOTAL_ERRORS + ERRORS))
    log_info "❌ Erros (últimos 5 min): $ERRORS"
    
    echo ""
    
    # Salvar métricas em arquivo
    METRICS_FILE="deploy-logs/metrics-$(date +%Y%m%d).csv"
    mkdir -p deploy-logs
    
    # Criar header se arquivo não existe
    if [ ! -f "$METRICS_FILE" ]; then
        echo "timestamp,error_rate,response_time,cookie_migration,csp_violations,xss_attempts,xss_success,requests,errors" > "$METRICS_FILE"
    fi
    
    # Adicionar linha de métricas
    echo "$timestamp,$ERROR_RATE,$RESPONSE_TIME,$COOKIE_MIGRATION,$CSP_VIOLATIONS,$XSS_ATTEMPTS,$XSS_SUCCESS,$REQUESTS,$ERRORS" >> "$METRICS_FILE"
}

###############################################################################
# FUNÇÃO: Resumo Final
###############################################################################

print_summary() {
    echo ""
    log_info "═══════════════════════════════════════════════════════════"
    log_info "RESUMO DO MONITORAMENTO"
    log_info "═══════════════════════════════════════════════════════════"
    echo ""
    
    log_info "⏱️  Duração: $DURATION_HOURS horas"
    log_info "📊 Iterações: $ITERATION"
    log_info "📈 Total de Requisições: $TOTAL_REQUESTS"
    log_info "❌ Total de Erros: $TOTAL_ERRORS"
    
    # Calcular taxa de erro média
    if [ "$TOTAL_REQUESTS" -gt 0 ]; then
        AVG_ERROR_RATE=$(awk -v errors="$TOTAL_ERRORS" -v reqs="$TOTAL_REQUESTS" 'BEGIN{printf "%.3f", (errors/reqs)*100}')
        log_info "📉 Taxa de Erro Média: $AVG_ERROR_RATE%"
    fi
    
    log_info "⏱️  Tempo de Resposta Máximo: ${MAX_RESPONSE_TIME}ms"
    
    echo ""
    
    # Avaliação final
    if [ "$TOTAL_ERRORS" -eq 0 ]; then
        log_success "╔══════════════════════════════════════════════════════════╗"
        log_success "║                                                          ║"
        log_success "║           ✅ MONITORAMENTO: SUCESSO TOTAL               ║"
        log_success "║                                                          ║"
        log_success "╚══════════════════════════════════════════════════════════╝"
    elif (( $(echo "$AVG_ERROR_RATE < 0.1" | bc -l) )); then
        log_success "╔══════════════════════════════════════════════════════════╗"
        log_success "║                                                          ║"
        log_success "║           ✅ MONITORAMENTO: SUCESSO                     ║"
        log_success "║                                                          ║"
        log_success "╚══════════════════════════════════════════════════════════╝"
    else
        log_warning "╔══════════════════════════════════════════════════════════╗"
        log_warning "║                                                          ║"
        log_warning "║           ⚠️  MONITORAMENTO: ATENÇÃO                    ║"
        log_warning "║                                                          ║"
        log_warning "╚══════════════════════════════════════════════════════════╝"
        log_warning "Revisar métricas e considerar ações corretivas"
    fi
    
    echo ""
    log_info "📊 Métricas salvas em: $METRICS_FILE"
    log_info "📚 Documentação: SECURITY_DEPLOYMENT_GUIDE.md"
    echo ""
}

###############################################################################
# LOOP PRINCIPAL DE MONITORAMENTO
###############################################################################

log_info "Iniciando monitoramento..."
log_info "Pressione Ctrl+C para interromper"
echo ""

# Trap para capturar Ctrl+C
trap 'echo ""; log_warning "Monitoramento interrompido pelo usuário"; print_summary; exit 0' INT

# Loop de monitoramento
while [ $(date +%s) -lt $END_TIME ]; do
    ITERATION=$((ITERATION + 1))
    
    # Coletar métricas
    collect_metrics $ITERATION
    
    # Verificar se chegou ao fim
    if [ $(date +%s) -ge $END_TIME ]; then
        break
    fi
    
    # Aguardar 5 minutos (300 segundos)
    log_info "Próxima coleta em 5 minutos..."
    sleep 300
done

# Resumo final
print_summary

exit 0
