import React, { useEffect, useRef, useState } from "react";

const ZOOM = 2;
const MAX_LENS_HEIGHT = 320;
const MIN_LENS_HEIGHT = 140;
const EDGE_PADDING = 12;

function syncPageSnapshot(pageRoot, content) {
  if (!pageRoot || !content) {
    return new WeakMap();
  }

  const pageZoom = parseFloat(window.getComputedStyle(pageRoot).zoom) || 1;
  const clone = pageRoot.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));

  const originalNodes = [pageRoot, ...pageRoot.querySelectorAll("*")];
  const clonedNodes = [clone, ...clone.querySelectorAll("*")];
  const originalsByClone = new WeakMap();
  const scrollPositions = [];
  originalNodes.forEach((element, index) => {
    const clonedElement = clonedNodes[index];
    originalsByClone.set(clonedElement, element);
    if (
      clonedElement instanceof HTMLElement &&
      clonedElement.matches("a, button, input, select, textarea, [tabindex]")
    ) {
      clonedElement.tabIndex = -1;
      clonedElement.removeAttribute("autofocus");
    }

    if (window.getComputedStyle(element).position === "fixed") {
      const bounds = element.getBoundingClientRect();
      clonedElement.style.position = "absolute";
      clonedElement.style.inset = "auto";
      clonedElement.style.left = `${(bounds.left + window.scrollX) / pageZoom}px`;
      clonedElement.style.top = `${(bounds.top + window.scrollY) / pageZoom}px`;
      clonedElement.style.width = `${bounds.width / pageZoom}px`;
      clonedElement.style.height = `${bounds.height / pageZoom}px`;
    }

    if (element instanceof HTMLInputElement && clonedElement instanceof HTMLInputElement) {
      clonedElement.value = element.value;
      clonedElement.checked = element.checked;
    } else if (element instanceof HTMLTextAreaElement && clonedElement instanceof HTMLTextAreaElement) {
      clonedElement.value = element.value;
    } else if (element instanceof HTMLSelectElement && clonedElement instanceof HTMLSelectElement) {
      clonedElement.selectedIndex = element.selectedIndex;
    }

    if (element.scrollTop || element.scrollLeft) {
      scrollPositions.push({
        element: clonedElement,
        top: element.scrollTop,
        left: element.scrollLeft,
      });
    }
  });

  content.replaceChildren(clone);
  scrollPositions.forEach(({ element, top, left }) => {
    element.scrollTop = top;
    element.scrollLeft = left;
  });
  return originalsByClone;
}

export default function PageMagnifier() {
  const [active, setActive] = useState(false);
  const lensRef = useRef(null);
  const contentRef = useRef(null);
  const originalsByCloneRef = useRef(new WeakMap());
  const pointerRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const pageRoot = document.querySelector(".app");
    const lens = lensRef.current;
    const content = contentRef.current;
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    if (!pageRoot || !lens || !content) {
      return undefined;
    }

    let pointerFrame = 0;
    let snapshotFrame = 0;

    const pointerIsOverLens = (event) => {
      const bounds = lens.getBoundingClientRect();
      return (
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom
      );
    };
    let pointerInsideLens = pointerIsOverLens(pointerRef.current);

    const updateLens = () => {
      const { x, y } = pointerRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const lensWidth = Math.max(1, viewportWidth);
      const lensHeight = Math.min(
        viewportHeight,
        Math.max(
          MIN_LENS_HEIGHT,
          Math.min(MAX_LENS_HEIGHT, viewportHeight * 0.35),
        ),
      );
      lens.style.width = `${lensWidth}px`;
      lens.style.height = `${lensHeight}px`;
      lens.style.left = "0px";
      lens.style.bottom = "0px";
      content.style.transform = `translate3d(${
        lens.clientWidth / 2 - (x + window.scrollX) * ZOOM
      }px, ${
        lens.clientHeight / 2 - (y + window.scrollY) * ZOOM
      }px, 0) scale(${ZOOM})`;
    };

    const updatePointer = (event) => {
      const isInsideLens = pointerIsOverLens(event);
      if (isInsideLens && pointerInsideLens) {
        return;
      }

      pointerInsideLens = isInsideLens;
      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(() => {
          pointerFrame = 0;
          updateLens();
        });
      }
    };

    const updatePointerMovement = (event) => {
      if (event.pointerType === "touch") {
        updatePointer(event);
        return;
      }

      if (coarsePointer.matches) {
        return;
      }

      updatePointer(event);
    };

    const updateTouchPointer = (event) => {
      if (event.pointerType === "touch") {
        updatePointer(event);
      }
    };

    const handleTouchStart = (event) => {
      const touch = event.touches[0];
      if (touch) {
        updatePointer(touch);
      }
    };

    const handleTouchMove = (event) => {
      const touch = event.touches[0];
      if (touch) {
        updatePointer(touch);
      }
    };

    const updateSnapshot = () => {
      if (snapshotFrame) {
        return;
      }

      snapshotFrame = window.requestAnimationFrame(() => {
        snapshotFrame = 0;
        originalsByCloneRef.current = syncPageSnapshot(pageRoot, content);
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
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("scroll", updateSnapshot, { capture: true, passive: true });
    window.addEventListener("input", updateSnapshot, true);
    window.addEventListener("resize", updateViewport);
    const handleMagnifiedClick = (event) => {
      const target = originalsByCloneRef.current.get(event.target);
      if (!(target instanceof HTMLElement)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      target.click();
    };
    lens.addEventListener("click", handleMagnifiedClick);
    originalsByCloneRef.current = syncPageSnapshot(pageRoot, content);
    updateLens();

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", updatePointerMovement);
      window.removeEventListener("pointerdown", updateTouchPointer);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", updateSnapshot, true);
      window.removeEventListener("input", updateSnapshot, true);
      window.removeEventListener("resize", updateViewport);
      lens.removeEventListener("click", handleMagnifiedClick);
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
        >
          <div ref={contentRef} className="page-magnifier__content" />
        </div>
      )}
    </>
  );
}
