/**
 * Componente reutilizável para Google AdSense
 * SSOT: O Publisher ID vem da variável de ambiente VITE_ADSENSE_CLIENT_ID
 * 
 * @example
 * // Uso básico
 * <AdSense slot="1234567890" />
 * 
 * // Com formato específico
 * <AdSense slot="1234567890" format="horizontal" />
 * 
 * // Anúncio in-feed
 * <AdSense slot="1234567890" format="fluid" layout="in-article" />
 */

import { useEffect, useRef } from 'react';

interface AdSenseProps {
  /**
   * ID da unidade de anúncio (obrigatório)
   * Exemplo: "1234567890"
   */
  slot: string;
  
  /**
   * Publisher ID do AdSense
   * Padrão: variável de ambiente VITE_ADSENSE_CLIENT_ID
   */
  client?: string;
  
  /**
   * Formato do anúncio
   * - auto: Responsivo automático (padrão)
   * - fluid: Fluido (adapta-se ao container)
   * - rectangle: Retângulo
   * - vertical: Vertical
   * - horizontal: Horizontal
   */
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  
  /**
   * Se o anúncio deve ser responsivo
   * Padrão: true
   */
  responsive?: boolean;
  
  /**
   * Layout especial para anúncios
   * - in-article: Para dentro de artigos
   * - in-feed: Para feeds de conteúdo
   */
  layout?: 'in-article' | 'in-feed';
  
  /**
   * Estilos customizados
   */
  style?: React.CSSProperties;
  
  /**
   * Classes CSS adicionais
   */
  className?: string;
}

// Declaração global para TypeScript
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/**
 * Hook para carregar o script do AdSense dinamicamente (SSOT)
 */
function useAdSenseScript(clientId: string) {
  useEffect(() => {
    // Verifica se o script já foi carregado
    const existingScript = document.querySelector(
      `script[src*="adsbygoogle.js"][src*="${clientId}"]`
    );

    if (existingScript) {
      return;
    }

    // Cria e adiciona o script dinamicamente
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove o script quando o componente é desmontado
      // (opcional, geralmente queremos manter o script carregado)
    };
  }, [clientId]);
}

export function AdSense(props: AdSenseProps) {
  const {
    slot,
    client = import.meta.env.VITE_ADSENSE_CLIENT_ID,
    format = 'auto',
    responsive = true,
    layout,
    style,
    className = '',
  } = props;

  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef(false);

  // Carrega o script do AdSense dinamicamente (SSOT)
  useAdSenseScript(client);

  useEffect(() => {
    // Evita inicialização duplicada
    if (isInitialized.current) {
      return;
    }

    // Aguarda o script do AdSense carregar
    const initAd = () => {
      try {
        if (window.adsbygoogle && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isInitialized.current = true;
        }
      } catch (err) {
        console.error('AdSense initialization error:', err);
      }
    };

    // Se o script já estiver carregado, inicializa imediatamente
    if (window.adsbygoogle) {
      initAd();
    } else {
      // Caso contrário, aguarda o carregamento
      const timer = setTimeout(initAd, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const defaultStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    minHeight: format === 'horizontal' ? '90px' : format === 'vertical' ? '250px' : '90px',
    ...style,
  };

  // Validação: se não houver client ID configurado, mostra placeholder
  if (!client || client === 'ca-pub-XXXXXXXXXXXXXXXX') {
    return <AdSensePlaceholder text="Configure VITE_ADSENSE_CLIENT_ID no .env.local" />;
  }

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={defaultStyle}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(layout && { 'data-ad-layout': layout })}
      />
    </div>
  );
}

/**
 * Componente de placeholder para quando o AdSense não está configurado
 * Útil para desenvolvimento
 */
export function AdSensePlaceholder(props: { height?: string; text?: string }) {
  const { height = '90px', text = 'Espaço para anúncio' } = props;

  return (
    <div
      className="flex items-center justify-center rounded-xl bg-muted/40 border border-border/50 text-muted-foreground text-sm"
      style={{ minHeight: height }}
    >
      {text}
    </div>
  );
}
