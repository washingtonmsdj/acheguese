import { useMemo } from "react";
import type { PizzaFlavor } from "../types";

interface Props {
  baseFlavor: PizzaFlavor;
  additionalFlavors: PizzaFlavor[];
  totalSlices: number;
  size?: "sm" | "md" | "lg" | "xl";
  showCrust?: boolean;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getFlavorColor(flavorName: string, index: number): string {
  const hash = hashString(`${flavorName}-${index}`);
  const hue = hash % 360;
  return `hsl(${hue} 68% 56%)`;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    x,
    y,
    "L",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}

export function PizzaSliceVisualizer({
  baseFlavor,
  additionalFlavors,
  totalSlices,
  size = "md",
  showCrust = false,
}: Props) {
  const allFlavors = useMemo(
    () => [baseFlavor, ...additionalFlavors],
    [baseFlavor, additionalFlavors],
  );

  const flavorCount = allFlavors.length;
  const slicesPerFlavor = Math.floor(totalSlices / flavorCount);

  const dimensions = useMemo(() => {
    switch (size) {
      case "sm":
        return { width: 120, height: 120, viewBox: 120 };
      case "lg":
        return { width: 240, height: 240, viewBox: 240 };
      case "xl":
        return { width: 300, height: 300, viewBox: 300 };
      default:
        return { width: 180, height: 180, viewBox: 240 };
    }
  }, [size]);

  const { center, outerRadius, innerRadius } = useMemo(() => {
    const localCenter = dimensions.viewBox / 2;
    return {
      center: localCenter,
      outerRadius: dimensions.viewBox * 0.42,
      innerRadius: dimensions.viewBox * 0.08,
    };
  }, [dimensions]);

  const flavorSegments = useMemo(() => {
    const anglePerFlavor = 360 / flavorCount;
    return allFlavors.map((flavor, index) => {
      const startAngle = index * anglePerFlavor;
      const endAngle = (index + 1) * anglePerFlavor;
      return {
        flavor,
        startAngle,
        endAngle,
        color: getFlavorColor(flavor.name, index),
        slices: slicesPerFlavor,
        percentage: Math.round((1 / flavorCount) * 100),
      };
    });
  }, [allFlavors, flavorCount, slicesPerFlavor]);

  const sliceLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const anglePerSlice = 360 / totalSlices;

    for (let i = 0; i < totalSlices; i += 1) {
      const angle = i * anglePerSlice;
      const start = polarToCartesian(center, center, innerRadius, angle);
      const end = polarToCartesian(center, center, outerRadius, angle);
      lines.push({ x1: start.x, y1: start.y, x2: end.x, y2: end.y });
    }

    return lines;
  }, [center, innerRadius, outerRadius, totalSlices]);

  if (flavorCount === 1) {
    return (
      <div className="flex flex-col items-center gap-3">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.viewBox} ${dimensions.viewBox}`}
          className="drop-shadow-md"
        >
          {showCrust ? (
            <>
              <circle
                cx={center}
                cy={center}
                r={outerRadius + 4}
                fill="#f5deb3"
                stroke="#d4a574"
                strokeWidth="2"
              />
              <circle
                cx={center}
                cy={center}
                r={outerRadius}
                fill="#fef3c7"
                stroke="#d4a574"
                strokeWidth="1"
              />
            </>
          ) : (
            <circle
              cx={center}
              cy={center}
              r={outerRadius}
              fill="#ffffff0f"
              stroke="#ffffff33"
              strokeWidth="1"
            />
          )}
          <circle
            cx={center}
            cy={center}
            r={showCrust ? outerRadius - 8 : outerRadius - 1}
            fill={flavorSegments[0]?.color ?? getFlavorColor(baseFlavor.name, 0)}
            opacity="0.9"
          />
          <circle cx={center} cy={center} r={innerRadius} fill={showCrust ? "#fef3c7" : "#ffffffd9"} />
          {sliceLines.map((line, index) => (
            <line
              key={index}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={showCrust ? "#d4a574" : "#ffffff99"}
              strokeWidth="1"
              opacity="0.6"
            />
          ))}
        </svg>
        <div className="text-center">
          <p className="text-sm font-medium">{baseFlavor.name}</p>
          <p className="text-xs text-muted-foreground">{totalSlices} fatias inteiras</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.viewBox} ${dimensions.viewBox}`}
        className="drop-shadow-md"
      >
        <defs>
          <radialGradient id="crustGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="85%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d4a574" />
          </radialGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {showCrust ? (
          <>
            <circle
              cx={center}
              cy={center}
              r={outerRadius + 4}
              fill="#f5deb3"
              stroke="#d4a574"
              strokeWidth="2"
            />
            <circle
              cx={center}
              cy={center}
              r={outerRadius}
              fill="url(#crustGradient)"
              stroke="#d4a574"
              strokeWidth="1"
            />
          </>
        ) : (
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="#ffffff0f"
            stroke="#ffffff33"
            strokeWidth="1"
          />
        )}

        {flavorSegments.map((segment) => {
          const path = describeArc(
            center,
            center,
            showCrust ? outerRadius - 6 : outerRadius - 1,
            segment.startAngle,
            segment.endAngle,
          );
          return (
            <path
              key={segment.flavor.id}
              d={path}
              fill={segment.color}
              opacity="0.85"
              stroke="white"
              strokeWidth="2"
              style={{ filter: "url(#softShadow)", transition: "all 0.3s ease" }}
            />
          );
        })}

        {sliceLines.map((line, index) => (
          <line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={showCrust ? "#8b6914" : "#ffffff99"}
            strokeWidth="1"
            opacity="0.4"
          />
        ))}

        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill={showCrust ? "url(#crustGradient)" : "#ffffffd9"}
          stroke={showCrust ? "#d4a574" : "#ffffff4d"}
          strokeWidth="1"
        />
      </svg>

      <div className="w-full space-y-2">
        <p className="text-center text-xs font-medium text-muted-foreground">
          {totalSlices} fatias · {flavorCount} sabores
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {flavorSegments.map((segment) => (
            <div
              key={segment.flavor.id}
              className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-1"
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs font-medium">{segment.flavor.name}</span>
              <span className="text-xs text-muted-foreground">
                ({segment.slices}f · {segment.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
