"use client";

import { useEffect } from "react";

export const ADD_TO_BAG_EVENT = "zenom:add-to-bag";
export const BAG_BUTTON_ID = "bag-button";

type FlyDetail = { fromEl: HTMLElement; imageUrl: string };

// Call after a successful add: the artwork disc arcs into the Bag button
// (950ms, peaking 140px above the straight line) and the Bag pulses.
export function triggerAddToBagFly(fromEl: HTMLElement, imageUrl: string) {
  window.dispatchEvent(new CustomEvent<FlyDetail>(ADD_TO_BAG_EVENT, { detail: { fromEl, imageUrl } }));
}

export function AddToBagFly() {
  useEffect(() => {
    const handler = (e: Event) => {
      const { fromEl, imageUrl } = (e as CustomEvent<FlyDetail>).detail ?? {};
      const bag = document.getElementById(BAG_BUTTON_ID);
      if (!fromEl || !bag || typeof bag.animate !== "function") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const from = fromEl.getBoundingClientRect();
      const to = bag.getBoundingClientRect();
      const disc = document.createElement("img");
      disc.src = imageUrl;
      disc.alt = "";
      Object.assign(disc.style, {
        position: "fixed",
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
        borderRadius: "50%",
        objectFit: "cover",
        zIndex: "1250",
        pointerEvents: "none",
        boxShadow: "0 10px 30px rgba(0,0,0,.5)",
      });
      document.body.appendChild(disc);

      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const flight = disc.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${dx * 0.45}px,${dy * 0.5 - 140}px) scale(.85)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: 0.3 },
        ],
        { duration: 950, easing: "cubic-bezier(.5,0,.2,1)" }
      );
      flight.onfinish = () => {
        disc.remove();
        bag.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }],
          { duration: 480, easing: "cubic-bezier(.3,1.6,.5,1)" }
        );
      };
    };

    window.addEventListener(ADD_TO_BAG_EVENT, handler);
    return () => window.removeEventListener(ADD_TO_BAG_EVENT, handler);
  }, []);

  return null;
}
