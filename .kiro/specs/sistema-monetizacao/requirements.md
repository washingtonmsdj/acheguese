# Requirements Document

## Introduction

Este documento especifica os requisitos para um sistema completo de monetização para o app de rede social local. O sistema abrange quatro pilares principais:

1. **Planos de Assinatura**: Para usuários, empresas, profissionais e anunciantes
2. **Sistema de Impulsionamento (Boost)**: Para destacar conteúdo específico com duração e alcance configuráveis
3. **Anúncios Patrocinados**: Banners, posts patrocinados e destaque em buscas
4. **Sistema de Créditos/Tokens**: Moeda interna para comprar boosts e serviços

O sistema integra-se com gateway de pagamento (Stripe/Mercado Pago), sistema de notificações, analytics e controle de permissões existente.

## Glossary

- **Monetization_System**: Sistema completo de monetização incluindo assinaturas, boosts, anúncios e créditos
- **Subscription_Manager**: Gerenciador de planos de assinatura para diferentes tipos de usuários
- **Boost_Engine**: Motor de impulsionamento que controla visibilidade e alcance de conteúdo
- **Ad_Manager**: Gerenciador de anúncios patrocinados e campanhas publicitárias
- **Credit_System**: Sistema de créditos/tokens para compra de serviços de monetização
- **Payment_Gateway**: Interface com provedores de pagamento (Stripe/Mercado Pago)
- **Subscription_Plan**: Plano de assinatura com recursos, limites e preço definidos
- **Boost_Campaign**: Campanha de impulsionamento com duração, alcance e orçamento
- **Sponsored_Content**: Conteúdo patrocinado (post, banner, destaque em busca)
- **Credit_Package**: Pacote de créditos com quantidade e desconto
- **Boost_Target**: Alvo do impulsionamento (post, produto, serviço, classificado)
- **Boost_Scope**: Alcance geográfico do boost (bairro, cidade, região)
- **Revenue_Analytics**: Analytics de receita e performance de monetização
- **Subscription_Tier**: Nível de assinatura (free, basic, premium, enterprise)
- **Ad_Placement**: Posicionamento de anúncio (feed, banner, busca, sidebar)
- **Credit_Transaction**: Transação de créditos (compra, uso, expiração)

## Requirements

### Requirement 1: Planos de Assinatura para Usuários Comuns

**User Story:** Como usuário comum, eu quero assinar planos que me deem mais recursos na plataforma, para que eu possa postar mais conteúdo e ter acesso a funcionalidades premium.

#### Acceptance Criteria

1. THE Subscription_Manager SHALL support subscription plans: free, basic, premium, enterprise
2. WHEN a user subscribes to a plan, THE Subscription_Manager SHALL activate the plan immediately after payment confirmation
3. THE Subscription_Manager SHALL enforce plan limits: max_posts, max_photos, max_businesses
4. WHEN a user exceeds plan limits, THE Subscription_Manager SHALL prevent the action and suggest upgrade
5. THE Subscription_Manager SHALL provide plan features: analytics, priority_support, verified_badge, ads_free
6. WHEN a subscription expires, THE Subscription_Manager SHALL downgrade the user to free plan
7. THE Subscription_Manager SHALL allow users to upgrade, downgrade or cancel subscriptions
8. WHEN a user cancels, THE Subscription_Manager SHALL maintain access until current period ends

### Requirement 2: Planos de Assinatura para Empresas

**User Story:** Como empresa, eu quero assinar planos específicos para negócios, para que eu possa ter página profissional, analytics e destaque nas buscas.

#### Acceptance Criteria

1. THE Subscription_Manager SHALL support business plans: basico (R$29), profissional (R$79), premium (R$149)
2. THE Subscription_Manager SHALL enforce business plan limits: photos, products, services, agendamentos_mes, cupons_actives
3. WHEN a business subscribes to profissional or premium, THE Subscription_Manager SHALL enable analytics dashboard
4. WHEN a business subscribes to premium, THE Subscription_Manager SHALL provide verified badge and priority positioning
5. THE Subscription_Manager SHALL link business subscription to business_profile_id not user_id
6. WHEN business plan expires, THE Subscription_Manager SHALL restrict features to basico limits
7. THE Subscription_Manager SHALL allow business to change plans with prorated billing

### Requirement 3: Planos para Profissionais e Anunciantes

**User Story:** Como profissional ou anunciante de classificados, eu quero planos específicos para meu tipo de atividade, para que eu possa destacar meus serviços ou anúncios.

#### Acceptance Criteria

1. THE Subscription_Manager SHALL support professional service plans with limits on service listings and bookings
2. THE Subscription_Manager SHALL support classified advertiser plans with limits on active ads and featured listings
3. WHEN a professional subscribes, THE Subscription_Manager SHALL enable booking system and service showcase
4. WHEN a classified advertiser subscribes, THE Subscription_Manager SHALL enable featured ad placement
5. THE Subscription_Manager SHALL link professional/advertiser subscription to respective profile_id
6. THE Subscription_Manager SHALL provide plan-specific features for each user type

### Requirement 4: Sistema de Créditos/Tokens

**User Story:** Como usuário, eu quero comprar créditos para usar em boosts e serviços, para que eu possa pagar apenas pelo que uso sem assinatura mensal.

#### Acceptance Criteria

1. THE Credit_System SHALL allow users to purchase credit packages with different quantities and discounts
2. THE Credit_System SHALL store credit balance per user_id
3. WHEN credits are purchased, THE Credit_System SHALL add credits to user balance after payment confirmation
4. WHEN credits are used, THE Credit_System SHALL deduct from user balance and record transaction
5. THE Credit_System SHALL provide credit transaction history with type, amount, date, and description
6. THE Credit_System SHALL support credit expiration policies configurable per package
7. WHEN credits expire, THE Credit_System SHALL deduct expired credits and notify user
8. THE Credit_System SHALL prevent negative credit balance

### Requirement 5: Impulsionamento de Posts

**User Story:** Como usuário, eu quero impulsionar posts individuais para aparecer em destaque no feed, para que mais pessoas vejam meu conteúdo.

#### Acceptance Criteria

1. THE Boost_Engine SHALL allow boosting individual posts with configurable duration: 24h, 7 days, 30 days
2. THE Boost_Engine SHALL allow configurable geographic scope: bairro, cidade, região
3. WHEN a post is boosted, THE Boost_Engine SHALL display it prominently in feed for users within scope
4. THE Boost_Engine SHALL calculate boost cost based on duration and scope
5. THE Boost_Engine SHALL deduct credits or charge payment method when boost is activated
6. WHEN boost duration expires, THE Boost_Engine SHALL return post to normal visibility
7. THE Boost_Engine SHALL provide boost performance metrics: impressions, clicks, engagement
8. THE Boost_Engine SHALL notify user when boost is about to expire

### Requirement 6: Impulsionamento de Produtos, Serviços e Classificados

**User Story:** Como empresa, profissional ou anunciante, eu quero impulsionar produtos, serviços ou classificados específicos, para que eles apareçam em destaque nas buscas e listagens.

#### Acceptance Criteria

1. THE Boost_Engine SHALL allow boosting business products with duration and scope configuration
2. THE Boost_Engine SHALL allow boosting professional services with duration and scope configuration
3. THE Boost_Engine SHALL allow boosting classified ads with duration and scope configuration
4. WHEN a product/service/classified is boosted, THE Boost_Engine SHALL display it at top of relevant search results
5. WHEN a product/service/classified is boosted, THE Boost_Engine SHALL display it in featured sections
6. THE Boost_Engine SHALL link boost campaign to respective entity_id and entity_type
7. THE Boost_Engine SHALL allow multiple simultaneous boosts per profile with different targets
8. THE Boost_Engine SHALL provide comparative analytics across different boost campaigns

### Requirement 7: Anúncios Patrocinados - Banners e Feed

**User Story:** Como anunciante, eu quero criar anúncios patrocinados que apareçam como banners ou posts no feed, para que eu possa promover meu negócio de forma destacada.

#### Acceptance Criteria

1. THE Ad_Manager SHALL support sponsored ad creation with title, description, image, and link
2. THE Ad_Manager SHALL support ad placements: feed, banner_top, banner_sidebar, banner_bottom
3. WHEN an ad is created, THE Ad_Manager SHALL require approval before activation
4. WHEN an ad is approved, THE Ad_Manager SHALL display it in configured placements
5. THE Ad_Manager SHALL rotate ads in same placement to ensure fair distribution
6. THE Ad_Manager SHALL track ad performance: impressions, clicks, CTR
7. THE Ad_Manager SHALL charge based on impressions (CPM) or clicks (CPC)
8. WHEN ad budget is exhausted, THE Ad_Manager SHALL pause the ad campaign

### Requirement 8: Destaque em Resultados de Busca

**User Story:** Como empresa ou profissional, eu quero aparecer em destaque nos resultados de busca, para que usuários me encontrem mais facilmente.

#### Acceptance Criteria

1. THE Ad_Manager SHALL allow businesses to purchase featured placement in search results
2. THE Ad_Manager SHALL allow professionals to purchase featured placement in service searches
3. WHEN a featured placement is active, THE Ad_Manager SHALL display the entity at top of search results with "Patrocinado" label
4. THE Ad_Manager SHALL limit featured placements per search query to maintain user experience
5. THE Ad_Manager SHALL rotate featured placements when multiple entities compete for same keywords
6. THE Ad_Manager SHALL charge based on search impressions or clicks
7. THE Ad_Manager SHALL provide search performance analytics: search terms, impressions, clicks

### Requirement 9: Integração com Gateway de Pagamento

**User Story:** Como usuário, eu quero pagar assinaturas, créditos e boosts de forma segura, para que minhas transações sejam protegidas.

#### Acceptance Criteria

1. THE Payment_Gateway SHALL integrate with Stripe and Mercado Pago
2. WHEN a payment is initiated, THE Payment_Gateway SHALL redirect to secure payment page
3. WHEN payment is confirmed, THE Payment_Gateway SHALL activate the purchased service immediately
4. WHEN payment fails, THE Payment_Gateway SHALL notify user and provide retry option
5. THE Payment_Gateway SHALL support recurring payments for subscriptions
6. THE Payment_Gateway SHALL support one-time payments for credits and boosts
7. THE Payment_Gateway SHALL store payment method securely for future use
8. THE Payment_Gateway SHALL provide payment history and invoices

### Requirement 10: Sistema de Notificações de Monetização

**User Story:** Como usuário, eu quero receber notificações sobre minha assinatura, boosts e créditos, para que eu esteja sempre informado sobre o status dos meus serviços.

#### Acceptance Criteria

1. THE Monetization_System SHALL notify user when subscription is about to expire (7 days, 1 day before)
2. THE Monetization_System SHALL notify user when boost campaign is about to expire (24h before)
3. THE Monetization_System SHALL notify user when boost campaign ends
4. THE Monetization_System SHALL notify user when credits are about to expire
5. THE Monetization_System SHALL notify user when payment fails with retry instructions
6. THE Monetization_System SHALL notify user when subscription is successfully renewed
7. THE Monetization_System SHALL notify user when reaching plan limits (80%, 100%)
8. THE Monetization_System SHALL provide notification preferences for each notification type

### Requirement 11: Analytics de Receita e Performance

**User Story:** Como administrador, eu quero ver relatórios de receita de assinaturas, boosts e anúncios, para que eu possa acompanhar a performance financeira da plataforma.

#### Acceptance Criteria

1. THE Revenue_Analytics SHALL provide total revenue breakdown by source: subscriptions, boosts, ads, credits
2. THE Revenue_Analytics SHALL provide revenue trends over time: daily, weekly, monthly
3. THE Revenue_Analytics SHALL provide subscription metrics: active subscriptions, churn rate, MRR, ARR
4. THE Revenue_Analytics SHALL provide boost metrics: total boosts, average boost value, popular durations/scopes
5. THE Revenue_Analytics SHALL provide ad metrics: active campaigns, total ad spend, average CPM/CPC
6. THE Revenue_Analytics SHALL provide credit metrics: credits sold, credits used, credits expired
7. THE Revenue_Analytics SHALL provide user segmentation: paying users, free users, conversion rate
8. THE Revenue_Analytics SHALL export reports in CSV and PDF formats

### Requirement 12: Controle de Permissões e Limites

**User Story:** Como sistema, eu quero verificar permissões e limites de plano antes de permitir ações, para que usuários não excedam seus limites e sejam incentivados a fazer upgrade.

#### Acceptance Criteria

1. THE Subscription_Manager SHALL integrate with existing Authorization_Engine to check plan permissions
2. WHEN a user attempts an action, THE Subscription_Manager SHALL verify if action is allowed by current plan
3. WHEN plan limit is reached, THE Subscription_Manager SHALL block action and display upgrade prompt
4. THE Subscription_Manager SHALL provide real-time limit tracking: posts used/remaining, photos used/remaining
5. THE Subscription_Manager SHALL reset usage counters based on plan billing cycle
6. THE Subscription_Manager SHALL allow temporary limit overrides for special cases (admin action)
7. THE Subscription_Manager SHALL log all limit checks for audit and analytics

### Requirement 13: Gestão de Campanhas de Boost

**User Story:** Como usuário, eu quero gerenciar minhas campanhas de boost ativas, para que eu possa pausar, editar ou cancelar boosts quando necessário.

#### Acceptance Criteria

1. THE Boost_Engine SHALL provide dashboard listing all active and past boost campaigns
2. THE Boost_Engine SHALL allow pausing active boost campaigns
3. WHEN a boost is paused, THE Boost_Engine SHALL stop displaying boosted content and pause billing
4. THE Boost_Engine SHALL allow resuming paused campaigns
5. THE Boost_Engine SHALL allow extending boost duration by adding more credits/payment
6. THE Boost_Engine SHALL allow canceling boost campaigns with prorated refund
7. THE Boost_Engine SHALL provide campaign performance comparison across different targets
8. THE Boost_Engine SHALL suggest optimal duration and scope based on historical performance

### Requirement 14: Sistema de Pacotes de Créditos

**User Story:** Como usuário, eu quero comprar pacotes de créditos com desconto, para que eu economize ao comprar em maior quantidade.

#### Acceptance Criteria

1. THE Credit_System SHALL offer credit packages: pequeno (100 créditos), médio (500 créditos), grande (1000 créditos)
2. THE Credit_System SHALL apply progressive discounts: médio (5% off), grande (10% off)
3. THE Credit_System SHALL display credit package options with price per credit comparison
4. WHEN a package is purchased, THE Credit_System SHALL add bonus credits for promotional packages
5. THE Credit_System SHALL allow gifting credit packages to other users
6. THE Credit_System SHALL provide credit package purchase history
7. THE Credit_System SHALL notify user of special credit package promotions

### Requirement 15: Prevenção de Fraude e Abuso

**User Story:** Como administrador, eu quero detectar e prevenir fraudes no sistema de monetização, para que a plataforma não seja explorada.

#### Acceptance Criteria

1. THE Monetization_System SHALL detect suspicious boost patterns: excessive boosts, rapid on/off cycles
2. THE Monetization_System SHALL detect payment fraud: multiple failed payments, stolen cards
3. WHEN fraud is detected, THE Monetization_System SHALL flag account for review
4. WHEN fraud is confirmed, THE Monetization_System SHALL suspend monetization features for the account
5. THE Monetization_System SHALL implement rate limiting on boost creation per profile
6. THE Monetization_System SHALL validate ad content before approval to prevent malicious ads
7. THE Monetization_System SHALL track refund requests and flag excessive refund patterns
8. THE Monetization_System SHALL provide fraud detection dashboard for admin monitoring

### Requirement 16: Migração de Dados Existentes

**User Story:** Como desenvolvedor, eu quero migrar dados existentes de assinaturas para o novo sistema, para que não haja perda de informação ou interrupção de serviço.

#### Acceptance Criteria

1. THE Monetization_System SHALL migrate existing user_subscriptions data to new schema
2. THE Monetization_System SHALL migrate existing business subscription types to new plan structure
3. THE Monetization_System SHALL preserve subscription history and payment records
4. WHEN migration runs, THE Monetization_System SHALL validate data integrity before committing
5. THE Monetization_System SHALL provide rollback mechanism in case of migration failure
6. THE Monetization_System SHALL maintain backward compatibility during transition period
7. THE Monetization_System SHALL log all migration operations for audit

### Requirement 17: Testes A/B de Preços e Planos

**User Story:** Como administrador, eu quero testar diferentes preços e configurações de planos, para que eu possa otimizar a receita e conversão.

#### Acceptance Criteria

1. THE Monetization_System SHALL support A/B testing of subscription plan prices
2. THE Monetization_System SHALL support A/B testing of credit package prices and discounts
3. THE Monetization_System SHALL support A/B testing of boost pricing models
4. WHEN A/B test is active, THE Monetization_System SHALL randomly assign users to test groups
5. THE Monetization_System SHALL track conversion rates per test group
6. THE Monetization_System SHALL provide statistical significance analysis for test results
7. THE Monetization_System SHALL allow rolling out winning variant to all users

### Requirement 18: Programa de Afiliados e Referência

**User Story:** Como usuário, eu quero ganhar créditos ao indicar novos usuários pagantes, para que eu seja recompensado por ajudar a crescer a plataforma.

#### Acceptance Criteria

1. THE Monetization_System SHALL provide unique referral codes per user
2. WHEN a referred user subscribes to paid plan, THE Monetization_System SHALL credit referrer with bonus credits
3. THE Monetization_System SHALL track referral conversions and credit earnings
4. THE Monetization_System SHALL provide referral dashboard showing pending and earned credits
5. THE Monetization_System SHALL prevent self-referral and referral fraud
6. THE Monetization_System SHALL allow configurable referral rewards per plan tier
7. THE Monetization_System SHALL notify referrer when referred user converts

### Requirement 19: Cupons e Promoções

**User Story:** Como administrador, eu quero criar cupons de desconto para assinaturas e créditos, para que eu possa fazer campanhas promocionais.

#### Acceptance Criteria

1. THE Monetization_System SHALL support coupon creation with discount percentage or fixed amount
2. THE Monetization_System SHALL support coupon restrictions: plan types, first purchase only, minimum purchase
3. THE Monetization_System SHALL support coupon expiration dates and usage limits
4. WHEN a valid coupon is applied, THE Monetization_System SHALL apply discount to purchase
5. WHEN an invalid coupon is applied, THE Monetization_System SHALL display clear error message
6. THE Monetization_System SHALL track coupon usage and redemption rates
7. THE Monetization_System SHALL prevent coupon stacking unless explicitly allowed
8. THE Monetization_System SHALL provide coupon performance analytics

### Requirement 20: Relatórios de Performance de Boost

**User Story:** Como usuário que impulsionou conteúdo, eu quero ver relatórios detalhados de performance, para que eu saiba se o investimento valeu a pena.

#### Acceptance Criteria

1. THE Boost_Engine SHALL provide boost performance report with impressions, clicks, engagement rate
2. THE Boost_Engine SHALL provide geographic breakdown of boost performance
3. THE Boost_Engine SHALL provide time-based performance: hourly, daily breakdown
4. THE Boost_Engine SHALL calculate ROI metrics: cost per impression, cost per click, cost per engagement
5. THE Boost_Engine SHALL compare boosted performance vs organic performance
6. THE Boost_Engine SHALL provide audience demographics for boosted content
7. THE Boost_Engine SHALL export boost reports in PDF format
8. THE Boost_Engine SHALL provide recommendations for future boost campaigns based on past performance

