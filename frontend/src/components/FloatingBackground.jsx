import { useMemo } from 'react';

// Decorative animated background for the join screen: colorful "message"
// bubbles with names float upward across the page. Purely cosmetic.
const NAMES = [
  'Carlos', 'Jesus', 'hector', 'Ana', 'Luis', 'María', 'Sofía', 'Diego',
  'Hi 👋', 'Hello!', 'socket.io', '¿Qué tal?', 'Marta', 'Pedro', 'Lucía',
  'connected', 'new message', 'Andrés', 'Elena', 'ping', 'pong',
];

const COLORS = [
  '#e17076', '#7bc862', '#65aadd', '#a695e7', '#ee7aae',
  '#6ec9cb', '#faa774', '#5ca6e4', '#f2749a', '#88c057', '#d97ede',
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export default function FloatingBackground() {
  // Generate a fixed set of bubbles once so they don't reshuffle on re-render.
  const bubbles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => {
        const color = COLORS[i % COLORS.length];
        return {
          id: i,
          label: NAMES[i % NAMES.length],
          left: `${rand(0, 92)}%`,
          duration: rand(14, 28),
          delay: rand(0, 16),
          fontSize: rand(0.8, 1.4),
          color,
        };
      }),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="floating-bubble"
          style={{
            left: b.left,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            fontSize: `${b.fontSize}rem`,
            color: '#fff',
            backgroundColor: b.color + 'cc',
          }}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
