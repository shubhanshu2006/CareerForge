"use client";

import { useEffect } from "react";

/**
 * Mounts an IntersectionObserver that adds the "visible" class to any
 * element with a reveal class (.reveal, .reveal-left, .reveal-right,
 * .reveal-scale) once it enters the viewport.
 *
 * Drop this anywhere inside the landing layout — it renders nothing.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const selector = ".reveal, .reveal-left, .reveal-right, .reveal-scale";
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target); // animate once
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
