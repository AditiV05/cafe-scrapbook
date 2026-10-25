import { useEffect, useState } from "react";

/**
 * Lays the notes out in staggered columns without losing rank order.
 *
 * CSS `columns` fills each column top-to-bottom, so no.01 no.02 no.03 end up
 * stacked in the first column and the top row reads 1, 14, 28. Dealing the
 * cards round-robin across flex columns keeps the reading order while the
 * differing note heights still stagger.
 */
function useColumnCount() {
  const [n, setN] = useState(() =>
    typeof window === "undefined" ? 3 : columnsFor(window.innerWidth),
  );
  useEffect(() => {
    const onResize = () => setN(columnsFor(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return n;
}

// 640 was too late for the second column: a single 600px-wide card is a
// column of its own with nothing beside it. 1600 gets a fourth, because the
// board was pinned at 1120px on a 1920 screen with 400px of empty desk
// either side.
const columnsFor = (w) => (w >= 1600 ? 4 : w >= 1024 ? 3 : w >= 560 ? 2 : 1);

export default function Board({ items, renderItem }) {
  const count = useColumnCount();
  const columns = Array.from({ length: count }, () => []);
  items.forEach((item, i) => columns[i % count].push({ item, index: i }));

  return (
    <div className="board">
      {columns.map((col, c) => (
        <div key={c} className="board__col">
          {col.map(({ item, index }) => renderItem(item, index))}
        </div>
      ))}
    </div>
  );
}
