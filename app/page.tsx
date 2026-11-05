"use client";

import { useCallback, useRef, useState } from "react";

const BTN_W = 118;
const BTN_H = 52;
const PAD = 24;

type Pos = { left: number; top: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Pick a spot inside the stage, away from the pointer */
function randomAwayFrom(
  pointerX: number,
  pointerY: number,
  stageW: number,
  stageH: number
): Pos {
  const maxL = Math.max(PAD, stageW - BTN_W - PAD);
  const maxT = Math.max(PAD, stageH - BTN_H - PAD);

  let best: Pos = {
    left: clamp(stageW / 2 - BTN_W / 2, PAD, maxL),
    top: clamp(stageH / 2 - BTN_H / 2, PAD, maxT),
  };
  let bestDist = -1;

  for (let i = 0; i < 18; i++) {
    const left = PAD + Math.random() * Math.max(0, maxL - PAD);
    const top = PAD + Math.random() * Math.max(0, maxT - PAD);
    const cx = left + BTN_W / 2;
    const cy = top + BTN_H / 2;
    const dist = Math.hypot(cx - pointerX, cy - pointerY);
    // Prefer farther spots, but keep a minimum jump so it clearly moves
    if (dist > bestDist && dist > 90) {
      bestDist = dist;
      best = { left, top };
    } else if (bestDist < 0) {
      best = { left, top };
      bestDist = dist;
    }
  }

  return {
    left: clamp(best.left, PAD, maxL),
    top: clamp(best.top, PAD, maxT),
  };
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => {
    const colors = ["#e85d4c", "#ffb4a2", "#c44536", "#ffd0c2", "#f07162", "#fff"];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.6}s`,
      duration: `${2.2 + Math.random() * 1.8}s`,
      color: colors[i % colors.length],
      rotate: `${Math.random() * 360}deg`,
    };
  });

  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: p.left,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotate})`,
          }}
        />
      ))}
    </div>
  );
}

function NoButton({
  fleeing,
  style,
  buttonRef,
  onFlee,
}: {
  fleeing: boolean;
  style?: React.CSSProperties;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onFlee: (clientX: number, clientY: number) => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`btn btn-no${fleeing ? " is-fleeing" : ""}`}
      style={style}
      onMouseEnter={(e) => onFlee(e.clientX, e.clientY)}
      onMouseMove={fleeing ? (e) => onFlee(e.clientX, e.clientY) : undefined}
      onPointerDown={(e) => {
        e.preventDefault();
        onFlee(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        const t = e.touches[0];
        if (t) onFlee(t.clientX, t.clientY);
      }}
      onFocus={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onFlee(r.left + r.width / 2, r.top + r.height / 2);
      }}
      aria-label="No (good luck)"
    >
      NO
    </button>
  );
}

export default function HomePage() {
  const [accepted, setAccepted] = useState(false);
  const [fleeing, setFleeing] = useState(false);
  const [noPos, setNoPos] = useState<Pos>({ left: 0, top: 0 });
  const noRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const lastFleeAt = useRef(0);

  const flee = useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    const now = Date.now();
    // Let the slide finish so the button stays visible and readable
    if (fleeing && now - lastFleeAt.current < 280) return;
    lastFleeAt.current = now;

    const rect = stage.getBoundingClientRect();
    const next = randomAwayFrom(
      clientX - rect.left,
      clientY - rect.top,
      rect.width,
      rect.height
    );

    setFleeing(true);
    setNoPos(next);
  }, [fleeing]);

  if (accepted) {
    return (
      <main className="stage" ref={stageRef}>
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <Confetti />
        <div className="thanks">
          <div className="heart" aria-hidden>
            ♥
          </div>
          <p className="eyebrow">You said yes</p>
          <h1 className="headline">
            Thank you for
            <br />
            <em>unblocking me</em>
          </h1>
          <p className="subcopy">Appreciate it.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="stage" ref={stageRef}>
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />

      <div className="content">
        <p className="eyebrow">A small request</p>
        <h1 className="headline">
          Please unblock me
          <br />
          <em>from everywhere</em>
        </h1>
        <div className="actions">
          <button
            type="button"
            className="btn btn-ok"
            onClick={() => {
              setAccepted(true);
              void fetch("/api/ok", { method: "POST" });
            }}
          >
            OK
          </button>

          {fleeing ? (
            <span className="btn-spacer" aria-hidden />
          ) : (
            <NoButton fleeing={false} buttonRef={noRef} onFlee={flee} />
          )}
        </div>
      </div>

      {/* Rendered on stage so transform on .content can't break positioning */}
      {fleeing && (
        <NoButton
          fleeing
          buttonRef={noRef}
          onFlee={flee}
          style={{ left: noPos.left, top: noPos.top }}
        />
      )}
    </main>
  );
}
