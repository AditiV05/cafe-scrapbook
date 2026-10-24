// ── Scrapbook decoration ──
//
// Decoration is keyed off the café's index so it is stable across renders —
// a card must not re-tape itself every time you type in the search box.
//
// It also thins out down the page. Twelve taped, tilted, stickered cards is
// charming; forty-five is seasickness. Past the first screenful the tilt
// stops and stickers become rare.

import yay from "../assets/barista-yay.png";
import wave from "../assets/barista-wave.png";
import think1 from "../assets/barista-think1.png";
import point from "../assets/barista-point.png";
import chaos from "../assets/barista-chaos.png";
import idle from "../assets/barista-idle.png";
import think2 from "../assets/barista-think2.png";
import caught from "../assets/barista-caught.png";
import sleep from "../assets/barista-sleep.png";
import sad from "../assets/barista-sad.png";

const STICKERS = [yay, wave, think1, point, chaos, idle, think2, caught, sleep, sad];
const TAPES = ["tape--a", "tape--b", "tape--c"];
const MARKERS = ["marker", "marker marker--mint", "marker marker--rose"];
const TINTS = ["", "", "note--tintA", "", "note--tintB", "", "note--tintC"];

export function decorate(index, rank) {
  const early = index < 12; // roughly the first screenful on a laptop

  // One sticker in four up top, one in eight after that.
  const wantsSticker = early ? index % 4 === 0 : index % 8 === 3;
  const badge =
    rank === 1 ? { text: "★ No.1", color: "#C0392B" }
    : rank === 3 ? { text: "GO HERE", color: "#4C7A5A" }
    : null;

  return {
    tilt: early ? `tilt-${(index % 4) + 1}` : "tilt-0",
    tint: TINTS[index % TINTS.length],
    tape: TAPES[index % TAPES.length],
    marker: MARKERS[index % MARKERS.length],
    // never a clip and a ring on the same card — together they read as one
    // muddled blue-grey shape instead of two different annotations
    clip: early && index % 5 === 1 && index !== 1,
    ring: index === 1,
    badge,
    // Never put a sticker in the corner a badge already occupies.
    sticker: wantsSticker || badge
      ? {
          src: STICKERS[index % STICKERS.length],
          pos: badge ? "sticker--bl" : index % 8 === 3 ? "sticker--tr" : "sticker--br",
        }
      : null,
  };
}
