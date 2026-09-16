/*
  عائلة الأجسام الصلصالية
  ------------------------------------------------------------------
  كل جسم مرسوم بالقواعد نفسها حتى تبدو الأدوات المدرسية كأنها من
  صندوق لُعب واحد:
    • لا خطوط خارجية — السماكة تُبنى بوصلات دائرية (stroke = نفس اللون).
    • وجهان لكل جسم: وجه يتلقى الضوء، وقاعدة أغمق تمثّل سُمك الصلصال.
    • ضوء من الأعلى دائمًا — لا ينعكس في RTL لأن الضوء ليس اتجاه قراءة.
    • بريق واحد فقط (نقطة بيضاء) وظلّ تماس واحد. لا لمعان إضافي.
  رسم SVG خفيف: لا يُحمَّل معه أي مكتبة، ويصلح لكل الشاشات.
*/
import { memo } from "react";

export type ClayName =
  | "book"
  | "pencil"
  | "star"
  | "bag"
  | "calculator"
  | "microscope"
  | "globe"
  | "crown";

export type ClayTone = "rose" | "apricot" | "lemon" | "mint" | "sky" | "lilac" | "gold";

type Props = {
  name: ClayName;
  tone?: ClayTone;
  size?: number;
  /** ظلّ التماس تحت الجسم — يُطفأ داخل البطاقات التي لها ظلّها الخاص. */
  grounded?: boolean;
  className?: string;
  title?: string;
};

function ClayObjectBase({
  name,
  tone = "lilac",
  size = 96,
  grounded = true,
  className,
  title,
}: Props) {
  const face = `var(--iz-${tone})`;
  const deep = `var(--iz-${tone}-deep)`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {grounded && <ellipse cx="48" cy="86" rx="24" ry="4.5" fill="var(--iz-ink)" opacity="0.1" />}
      {renderShape(name, face, deep)}
      {/* البريق: نقطة واحدة أعلى يسار الكتلة، بلا تكرار */}
      <ellipse cx="36" cy="30" rx="7" ry="4.5" fill="#fff" opacity="0.45" transform="rotate(-24 36 30)" />
    </svg>
  );
}

function renderShape(name: ClayName, face: string, deep: string) {
  switch (name) {
    case "book":
      return (
        <g>
          <path d="M48 36 C38 30 24 30 14 36 L14 68 C24 62 38 62 48 68 Z" fill={deep} />
          <path d="M48 36 C58 30 72 30 82 36 L82 68 C72 62 58 62 48 68 Z" fill={deep} />
          <path d="M48 30 C38 24 24 24 14 30 L14 62 C24 56 38 56 48 62 Z" fill={face} />
          <path d="M48 30 C58 24 72 24 82 30 L82 62 C72 56 58 56 48 62 Z" fill={face} />
          <path d="M22 38 C30 35 38 35 44 38" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M52 38 C58 35 66 35 74 38" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M48 30 L48 62" stroke={deep} strokeWidth="4" strokeLinecap="round" />
        </g>
      );

    case "pencil":
      return (
        <g transform="rotate(-32 48 48)">
          <rect x="39" y="12" width="18" height="9" rx="4" fill="var(--iz-rose)" />
          <rect x="39" y="19" width="18" height="46" rx="3" fill={face} />
          <rect x="50" y="19" width="7" height="46" fill={deep} />
          <path d="M39 65 L57 65 L48 84 Z" fill="var(--iz-apricot)" />
          <path d="M43.5 75 L52.5 75 L48 84 Z" fill="var(--iz-ink)" />
        </g>
      );

    case "star":
      return (
        <path
          d="M48 16 L56.2 36.7 L78.4 38.1 L61.3 52.3 L66.8 73.9 L48 62 L29.2 73.9 L34.7 52.3 L17.6 38.1 L39.8 36.7 Z"
          fill={face}
          stroke={face}
          strokeWidth="9"
          strokeLinejoin="round"
        />
      );

    case "bag":
      return (
        <g>
          <path d="M38 34 C38 18 58 18 58 34" stroke={deep} strokeWidth="6" strokeLinecap="round" fill="none" />
          <rect x="20" y="36" width="56" height="44" rx="16" fill={deep} />
          <rect x="20" y="30" width="56" height="44" rx="16" fill={face} />
          <path d="M20 44 C20 36 26 30 36 30 L60 30 C70 30 76 36 76 44 Z" fill={deep} opacity="0.55" />
          <rect x="34" y="52" width="28" height="16" rx="7" fill="#fff" opacity="0.72" />
          <rect x="43" y="40" width="10" height="12" rx="4" fill="var(--iz-lemon)" />
        </g>
      );

    case "calculator":
      return (
        <g>
          <rect x="24" y="22" width="48" height="58" rx="13" fill={deep} />
          <rect x="24" y="17" width="48" height="56" rx="13" fill={face} />
          <rect x="32" y="25" width="32" height="14" rx="5" fill="#fff" opacity="0.85" />
          <rect x="52" y="30" width="8" height="4" rx="2" fill={deep} opacity="0.5" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={32 + col * 12}
                y={45 + row * 10}
                width="8"
                height="8"
                rx="3"
                fill={deep}
                opacity={row === 2 && col === 2 ? 1 : 0.55}
              />
            )),
          )}
        </g>
      );

    case "microscope":
      return (
        <g>
          <rect x="22" y="68" width="52" height="12" rx="6" fill={deep} />
          <path d="M56 26 C72 36 70 56 56 62" stroke={face} strokeWidth="10" strokeLinecap="round" fill="none" />
          <rect x="30" y="56" width="34" height="9" rx="4" fill={face} />
          <g transform="rotate(22 50 34)">
            <rect x="42" y="14" width="17" height="34" rx="8" fill={face} />
            <rect x="40" y="10" width="21" height="9" rx="4" fill={deep} />
          </g>
          <circle cx="57" cy="52" r="5.5" fill="#fff" opacity="0.85" />
          <rect x="38" y="63" width="20" height="5" rx="2.5" fill={deep} opacity="0.6" />
        </g>
      );

    case "globe":
      return (
        <g>
          <rect x="32" y="74" width="32" height="9" rx="4.5" fill={deep} />
          <rect x="44.5" y="64" width="7" height="12" rx="3.5" fill={deep} />
          <circle cx="48" cy="45" r="29" fill={deep} />
          <circle cx="48" cy="42" r="28" fill={face} />
          <ellipse cx="48" cy="42" rx="11" ry="28" fill="none" stroke={deep} strokeWidth="3" opacity="0.7" />
          <path d="M22 34 H74 M22 50 H74" stroke={deep} strokeWidth="3" opacity="0.7" strokeLinecap="round" />
          <path d="M34 26 C42 24 46 30 40 34 C34 38 30 32 34 26 Z" fill={deep} opacity="0.55" />
          <path d="M56 50 C64 48 68 56 60 60 C54 63 52 54 56 50 Z" fill={deep} opacity="0.55" />
        </g>
      );

    case "crown":
      return (
        <g>
          <path
            d="M20 62 L26 30 L38 45 L48 24 L58 45 L70 30 L76 62 Z"
            fill={face}
            stroke={face}
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <rect x="19" y="59" width="58" height="14" rx="7" fill={deep} />
          <circle cx="34" cy="66" r="3" fill="#fff" opacity="0.8" />
          <circle cx="48" cy="66" r="3" fill="#fff" opacity="0.8" />
          <circle cx="62" cy="66" r="3" fill="#fff" opacity="0.8" />
        </g>
      );
  }
}

export const ClayObject = memo(ClayObjectBase);
