/**
 * Safe SVG Utilities
 * 
 * Funções para criar SVG de forma segura sem innerHTML.
 * Usa DOM API nativa para evitar XSS.
 */

/**
 * Cria elemento SVG de forma segura usando DOM API
 * 
 * @example
 * ```typescript
 * const svg = createSafeSvg({
 *   width: 60,
 *   height: 60,
 *   viewBox: '0 0 60 60'
 * });
 * ```
 */
export function createSafeSvg(attrs: Record<string, string | number>): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  
  Object.entries(attrs).forEach(([key, value]) => {
    svg.setAttribute(key, String(value));
  });
  
  return svg;
}

/**
 * Cria círculo SVG de forma segura
 */
export function createSvgCircle(attrs: Record<string, string | number>): SVGCircleElement {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  
  Object.entries(attrs).forEach(([key, value]) => {
    circle.setAttribute(key, String(value));
  });
  
  return circle;
}

/**
 * Cria path SVG de forma segura
 */
export function createSvgPath(attrs: Record<string, string | number>): SVGPathElement {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  
  Object.entries(attrs).forEach(([key, value]) => {
    path.setAttribute(key, String(value));
  });
  
  return path;
}

/**
 * Cria animate SVG de forma segura
 */
export function createSvgAnimate(attrs: Record<string, string | number>): SVGAnimateElement {
  const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
  
  Object.entries(attrs).forEach(([key, value]) => {
    animate.setAttribute(key, String(value));
  });
  
  return animate;
}

/**
 * Cria marcador de localização do usuário (SVG animado)
 * ✅ SEGURO - Usa DOM API ao invés de innerHTML
 */
export function createUserLocationSvg(): SVGSVGElement {
  const svg = createSafeSvg({
    width: 60,
    height: 60,
    viewBox: '0 0 60 60',
    xmlns: 'http://www.w3.org/2000/svg'
  });

  // Círculo externo animado
  const outerCircle = createSvgCircle({
    cx: 30,
    cy: 30,
    r: 28,
    fill: '#10b981',
    opacity: 0.2
  });
  
  const animateR = createSvgAnimate({
    attributeName: 'r',
    from: 20,
    to: 28,
    dur: '1.5s',
    repeatCount: 'indefinite'
  });
  
  const animateOpacity = createSvgAnimate({
    attributeName: 'opacity',
    from: 0.5,
    to: 0,
    dur: '1.5s',
    repeatCount: 'indefinite'
  });
  
  outerCircle.appendChild(animateR);
  outerCircle.appendChild(animateOpacity);

  // Círculo do meio
  const middleCircle = createSvgCircle({
    cx: 30,
    cy: 30,
    r: 16,
    fill: '#10b981',
    stroke: 'white',
    'stroke-width': 4
  });

  // Círculo interno
  const innerCircle = createSvgCircle({
    cx: 30,
    cy: 30,
    r: 7,
    fill: 'white'
  });

  svg.appendChild(outerCircle);
  svg.appendChild(middleCircle);
  svg.appendChild(innerCircle);

  return svg;
}

/**
 * Cria ícone de carro SVG (para motorista)
 * ✅ SEGURO - Usa DOM API ao invés de innerHTML
 */
export function createCarIconSvg(): SVGSVGElement {
  const svg = createSafeSvg({
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'white'
  });

  const path = createSvgPath({
    d: 'M5 17H3v-5l2-5h14l2 5v5h-2m0 0a2 2 0 0 1-4 0m4 0H7m0 0a2 2 0 0 1-4 0'
  });

  svg.appendChild(path);
  return svg;
}

/**
 * Cria ícone de pin SVG (para negócios)
 * ✅ SEGURO - Usa DOM API ao invés de innerHTML
 */
export function createPinIconSvg(): SVGSVGElement {
  const svg = createSafeSvg({
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'white'
  });

  const path1 = createSvgPath({
    d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'
  });

  const circle = createSvgCircle({
    cx: 12,
    cy: 10,
    r: 3
  });

  svg.appendChild(path1);
  svg.appendChild(circle);
  return svg;
}
