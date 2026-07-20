import { CONSTELLATIONS, type ZodiacSign } from "../../lib/yi/constellations";

export function ConstellationMap({
  sign,
  decorative = false,
}: {
  sign: ZodiacSign;
  decorative?: boolean;
}) {
  const map = CONSTELLATIONS[sign];

  return (
    <svg
      className="constellation-map"
      viewBox="0 0 100 100"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${map.chineseName}金色星座连线图`}
      focusable={decorative ? "false" : undefined}
    >
      <g className="constellation-dust">
        {Array.from({ length: 18 }, (_, index) => (
          <circle key={index} cx={(index * 37) % 97} cy={(index * 53) % 89} r=".25" />
        ))}
      </g>
      <g className="constellation-lines">
        {map.edges.map(([from, to], index) => (
          <line
            key={index}
            x1={map.nodes[from].x}
            y1={map.nodes[from].y}
            x2={map.nodes[to].x}
            y2={map.nodes[to].y}
            style={{ animationDelay: `${index * 70}ms` }}
          />
        ))}
      </g>
      <g className="constellation-stars">
        {map.nodes.map((node, index) => (
          <circle
            key={index}
            cx={node.x}
            cy={node.y}
            r={node.radius}
            className={node.primary ? "primary" : undefined}
          />
        ))}
      </g>
      <text x={map.label.x} y={map.label.y}>{`${map.glyph}\uFE0E`}</text>
    </svg>
  );
}
