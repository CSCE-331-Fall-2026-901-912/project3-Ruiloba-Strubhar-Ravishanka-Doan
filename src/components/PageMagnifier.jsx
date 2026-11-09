import React, { useEffect, useRef, useState } from "react";

const ZOOM = 2;
const LENS_WIDTH = 320;
const LENS_HEIGHT = 240;
const EDGE_PADDING = 12;

function syncPageSnapshot(pageRoot, content) {
  if (!pageRoot || !content) {
    return;
  }

  const clone = pageRoot.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));

  const originalNodes = [pageRoot, ...pageRoot.querySelectorAll("*")];
  const clonedNodes = [clone, ...clone.querySelectorAll("*")];
  originalNodes.forEach((element, index) => {
    const clonedElement = clonedNodes[index];
    if (element instanceof HTMLInputElement && clonedElement instanceof HTMLInputElement) {
      clonedElement.value = element.value;
      clonedElement.checked = element.checked;
    } else if (element instanceof HTMLTextAreaElement && clonedElement instanceof HTMLTextAreaElement) {
      clonedElement.value = element.value;
    } else if (element instanceof HTMLSelectElement && clonedElement instanceof HTMLSelectElement) {
      clonedElement.selectedIndex = element.selectedIndex;
    }

    clonedElement.scrollTop = element.scrollTop;
    clonedElement.scrollLeft = element.scrollLeft;
  });

  content.replaceChildren(clone);
}

export default function PageMagnifier() {
  const [active, setActive] = useState(false);
  const lensRef = useRef(null);
  const contentRef = useRef(null);
  const pointerRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const pageRoot = document.querySelector(".app");
    const lens = lensRef.current;
    const content = contentRef.current;
    if (!pageRoot || !lens || !content) {
      return undefined;
    }

    let pointerFrame = 0;
    let snapshotFrame = 0;
    let touchActive = false;
    let lastTouchTime = 0;

    const updateLens = () => {
      const { x, y } = pointerRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      lens.style.width = `${Math.max(
        1,
        Math.min(LENS_WIDTH, viewportWidth - EDGE_PADDING * 2),
      )}px`;
      lens.style.height = `${Math.max(
        1,
        Math.min(LENS_HEIGHT, viewportHeight - EDGE_PADDING * 2),
      )}px`;

      const lensBounds = lens.getBoundingClientRect();
      const lensLeft = Math.max(
        EDGE_PADDING,
        Math.min(x + 20, viewportWidth - lensBounds.width - EDGE_PADDING),
      );
      const lensTop = Math.max(
        EDGE_PADDING,
        Math.min(y + 20, viewportHeight - lensBounds.height - EDGE_PADDING),
      );

      lens.style.left = `${lensLeft}px`;
      lens.style.top = `${lensTop}px`;
      content.style.transform = `translate3d(${
        lens.clientWidth / 2 - x * ZOOM
      }px, ${
        lens.clientHeight / 2 - (y + window.scrollY) * ZOOM
      }px, 0) scale(${ZOOM})`;
    };

    const updatePointer = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(() => {
          pointerFrame = 0;
          updateLens();
        });
      }
    };

    const updatePointerMovement = (event) => {
      if (
        event.pointerType === "touch" ||
        touchActive ||
        Date.now() - lastTouchTime < 800
      ) {
        return;
      }

      updatePointer(event);
    };

    const updateTouchPointer = (event) => {
      if (event.pointerType === "touch") {
        lastTouchTime = Date.now();
        updatePointer(event);
      }
    };

    const handleTouchStart = (event) => {
      touchActive = true;
      lastTouchTime = Date.now();
      const touch = event.touches[0];
      if (touch) {
        updatePointer(touch);
      }
    };

    const handleTouchEnd = (event) => {
      touchActive = event.touches.length > 0;
      lastTouchTime = Date.now();
    };

    const updateSnapshot = () => {
      if (snapshotFrame) {
        return;
      }

      snapshotFrame = window.requestAnimationFrame(() => {
        snapshotFrame = 0;
        syncPageSnapshot(pageRoot, content);
        updateLens();
      });
    };

    const updateViewport = () => {
      pointerRef.current = {
        x: Math.min(pointerRef.current.x, Math.max(0, window.innerWidth - EDGE_PADDING)),
        y: Math.min(pointerRef.current.y, Math.max(0, window.innerHeight - EDGE_PADDING)),
      };
      updateSnapshot();
      updateLens();
    };

    const observer = new MutationObserver(updateSnapshot);
    observer.observe(pageRoot, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    window.addEventListener("pointermove", updatePointerMovement);
    window.addEventListener("pointerdown", updateTouchPointer);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    window.addEventListener("scroll", updateSnapshot, { capture: true, passive: true });
    window.addEventListener("input", updateSnapshot, true);
    window.addEventListener("resize", updateViewport);
    syncPageSnapshot(pageRoot, content);
    updateLens();

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", updatePointerMovement);
      window.removeEventListener("pointerdown", updateTouchPointer);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("scroll", updateSnapshot, true);
      window.removeEventListener("input", updateSnapshot, true);
      window.removeEventListener("resize", updateViewport);
      if (pointerFrame) {
        window.cancelAnimationFrame(pointerFrame);
      }
      if (snapshotFrame) {
        window.cancelAnimationFrame(snapshotFrame);
      }
    };
  }, [active]);

  return (
    <>
      <button
        className="page-magnifier__toggle"
        type="button"
        aria-pressed={active}
        onClick={(event) => {
          pointerRef.current = { x: event.clientX, y: event.clientY };
          setActive((current) => !current);
        }}
      >
        {active ? "Turn magnifier off" : "Turn magnifier on"}
      </button>
      {active && (
        <div
          ref={lensRef}
          className="page-magnifier__lens"
          aria-hidden="true"
          inert
        >
          <div ref={contentRef} className="page-magnifier__content" />
        </div>
      )}
    </>
  );
}
