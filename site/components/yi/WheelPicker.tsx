"use client";

import { useEffect, useRef } from "react";

export type WheelOption<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  label: string;
  value: T;
  options: WheelOption<T>[];
  onChange: (value: T) => void;
};

export function WheelPicker<T extends string | number>({ label, value, options, onChange }: Props<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const index = Math.max(0, options.findIndex((option) => option.value === value));
    ref.current?.children[index]?.scrollIntoView({ block: "center" });
  }, [options, value]);

  return (
    <div className="wheel-column">
      <span className="wheel-label">{label}</span>
      <div
        className="wheel-list"
        role="listbox"
        aria-label={label}
        ref={ref}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          const index = options.findIndex((option) => option.value === value);
          const next = Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
          onChange(options[next].value);
        }}
        onScroll={() => {
          if (frame.current !== null) cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(() => {
            const list = ref.current;
            if (!list) return;
            const center = list.getBoundingClientRect().top + list.clientHeight / 2;
            const children = Array.from(list.children) as HTMLElement[];
            const closest = children.reduce((best, child) => Math.abs(child.getBoundingClientRect().top + child.offsetHeight / 2 - center) < Math.abs(best.getBoundingClientRect().top + best.offsetHeight / 2 - center) ? child : best);
            const index = children.indexOf(closest);
            if (options[index] && options[index].value !== value) onChange(options[index].value);
          });
        }}
      >
        {options.map((option) => (
          <button
            type="button"
            role="option"
            aria-selected={option.value === value}
            className={option.value === value ? "selected" : ""}
            key={String(option.value)}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
