import React, { useEffect, useRef, useState } from "react";
import { REWARD_DISCOUNTS, useRewards } from "../hooks/RewardsContext.jsx";

export default function UseRewardsModal({
    isOpen,
    onClose,
    isHighContrast = false,
}) {
    const { points, selectedDiscounts, setSelectedDiscounts } = useRewards();
    const [draftCounts, setDraftCounts] = useState({});
    const [notice, setNotice] = useState("");

    const modalRef = useRef(null);
    const closeRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        setDraftCounts({ ...selectedDiscounts });
        setNotice("");

        const previouslyFocused = document.activeElement;
        const timer = setTimeout(() => {
            closeRef.current?.focus();
        }, 10);

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("keydown", handleKeyDown);
            if (previouslyFocused && typeof previouslyFocused.focus === "function") {
                previouslyFocused.focus();
            }
        };
    }, [isOpen, selectedDiscounts, onClose]);

    if (!isOpen) return null;

    const totalDraftCost = REWARD_DISCOUNTS.reduce(
        (sum, d) => sum + (Number(draftCounts[d.id]) || 0) * d.cost,
        0
    );
    const remainingPoints = Math.max(0, points - totalDraftCost);

    const handleModalKeyDown = (event) => {
        if (event.key !== "Tab" || !modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === first) {
                last.focus();
                event.preventDefault();
            }
        } else if (document.activeElement === last) {
            first.focus();
            event.preventDefault();
        }
    };

    const handleIncrement = (discount) => {
        if (remainingPoints < discount.cost) {
            setNotice(
                `Not enough points for "${discount.name}" (${discount.cost} pts needed, ${remainingPoints} pts remaining).`
            );
            return;
        }
        setNotice("");
        setDraftCounts((prev) => ({
            ...prev,
            [discount.id]: (Number(prev[discount.id]) || 0) + 1,
        }));
    };

    const handleDecrement = (discount) => {
        setNotice("");
        setDraftCounts((prev) => {
            const current = Number(prev[discount.id]) || 0;
            if (current <= 0) return prev;
            const next = { ...prev };
            if (current === 1) {
                delete next[discount.id];
            } else {
                next[discount.id] = current - 1;
            }
            return next;
        });
    };

    const handleApply = () => {
        setSelectedDiscounts({ ...draftCounts });
        onClose();
    };

    return (
        <div
            className="pg-modal-backdrop pg-use-rewards-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                ref={modalRef}
                onKeyDown={handleModalKeyDown}
                className={`pg-modal pg-use-rewards-modal ${isHighContrast ? "high-contrast" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pg-use-rewards-title"
                style={
                    isHighContrast
                        ? { backgroundColor: "#120024", border: "5px solid #ffffff", color: "#ffffff" }
                        : {}
                }
            >
                <button
                    ref={closeRef}
                    type="button"
                    className="pg-close"
                    onClick={onClose}
                    aria-label="Close rewards selector"
                >
                    ×
                </button>

                {/* Top dynamic points balance display */}
                <div
                    className="pg-use-rewards-top"
                    aria-live="polite"
                    style={
                        isHighContrast
                            ? {
                                backgroundColor: "#1e003a",
                                border: "3px solid #ffffff",
                            }
                            : {}
                    }
                >
                    <div>
                        <p
                            className="pg-eyebrow"
                            style={isHighContrast ? { color: "#ffb3df", fontWeight: "900" } : {}}
                        >
                            REDEEM REWARDS
                        </p>
                        <h2
                            id="pg-use-rewards-title"
                            style={isHighContrast ? { color: "#ffffff", fontWeight: "950" } : {}}
                        >
                            Available Points: <span>{remainingPoints}</span>{" "}
                            <small>(of {points} pts)</small>
                        </h2>
                    </div>
                    {totalDraftCost > 0 && (
                        <span
                            className="pg-use-rewards-spent"
                            style={
                                isHighContrast
                                    ? { color: "#ffb3df", fontWeight: "900" }
                                    : {}
                            }
                        >
                            −{totalDraftCost} pts selected
                        </span>
                    )}
                </div>

                {notice && (
                    <div className="pg-alert pg-rewards-insufficient-alert" role="alert">
                        {notice}
                    </div>
                )}

                <div className="pg-use-rewards-list">
                    {REWARD_DISCOUNTS.map((discount) => {
                        const count = Number(draftCounts[discount.id]) || 0;
                        const isSelected = count > 0;
                        const canAffordMore = remainingPoints >= discount.cost;

                        return (
                            <div
                                key={discount.id}
                                className={`pg-reward-option-row ${isSelected ? "selected" : ""} ${!canAffordMore && !isSelected ? "unaffordable" : ""
                                    }`}
                                style={
                                    isHighContrast
                                        ? {
                                            backgroundColor: isSelected ? "#2e0057" : "#1e003a",
                                            border: isSelected ? "4px solid #ffb3df" : "3px solid #ffffff",
                                        }
                                        : {}
                                }
                            >
                                {/* Clicking the main discount button increments its count by 1 */}
                                <button
                                    type="button"
                                    className="pg-reward-option-btn"
                                    aria-pressed={isSelected}
                                    aria-label={`${discount.name}, ${discount.cost} points. Currently selected: ${count}. Click to add one.`}
                                    onClick={() => handleIncrement(discount)}
                                    style={
                                        isHighContrast
                                            ? {
                                                backgroundColor: "transparent",
                                                border: "none",
                                                color: "#ffffff",
                                                textAlign: "left",
                                            }
                                            : {}
                                    }
                                >
                                    <div className="pg-reward-option-header">
                                        <span
                                            className="pg-reward-cost-badge"
                                            style={
                                                isHighContrast
                                                    ? {
                                                        backgroundColor: isSelected ? "#ffb3df" : "#ffffff",
                                                        color: "#120024",
                                                        fontWeight: "950",
                                                    }
                                                    : {}
                                            }
                                        >
                                            {discount.cost} pts
                                        </span>
                                        <strong
                                            style={
                                                isHighContrast
                                                    ? { color: isSelected ? "#ffb3df" : "#ffffff", fontWeight: "900" }
                                                    : {}
                                            }
                                        >
                                            {discount.name}
                                        </strong>
                                        {isSelected && (
                                            <span
                                                className="pg-reward-selected-tag"
                                                style={
                                                    isHighContrast
                                                        ? {
                                                            backgroundColor: "#ffffff",
                                                            color: "#120024",
                                                            fontWeight: "950",
                                                        }
                                                        : {}
                                                }
                                            >
                                                ✓ Selected ({count})
                                            </span>
                                        )}
                                    </div>
                                    <small
                                        style={isHighContrast ? { color: "#ffffff", fontWeight: "700" } : {}}
                                    >
                                        {discount.description}
                                    </small>
                                </button>

                                {/* Minus / Count / Plus stepper */}
                                <div
                                    className="pg-reward-stepper"
                                    role="group"
                                    aria-label={`${discount.name} quantity`}
                                >
                                    <button
                                        type="button"
                                        aria-label={`Decrease ${discount.name} count`}
                                        disabled={count === 0}
                                        onClick={() => handleDecrement(discount)}
                                        style={
                                            isHighContrast
                                                ? {
                                                    backgroundColor: "#120024",
                                                    color: "#ffffff",
                                                    border: "2px solid #ffffff",
                                                }
                                                : {}
                                        }
                                    >
                                        −
                                    </button>
                                    <span
                                        aria-live="polite"
                                        style={
                                            isHighContrast
                                                ? { color: "#ffffff", fontWeight: "950" }
                                                : {}
                                        }
                                    >
                                        {count}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`Increase ${discount.name} count`}
                                        aria-disabled={!canAffordMore}
                                        onClick={() => handleIncrement(discount)}
                                        style={
                                            isHighContrast
                                                ? {
                                                    backgroundColor: "#120024",
                                                    color: "#ffffff",
                                                    border: "2px solid #ffffff",
                                                    opacity: canAffordMore ? 1 : 0.55,
                                                }
                                                : {
                                                    opacity: canAffordMore ? 1 : 0.55,
                                                }
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pg-use-rewards-footer">
                    <button
                        type="button"
                        className="pg-rewards-cancel-btn"
                        onClick={onClose}
                        style={
                            isHighContrast
                                ? {
                                    backgroundColor: "#1e003a",
                                    color: "#ffffff",
                                    border: "3px solid #ffffff",
                                    fontWeight: "900",
                                }
                                : {}
                        }
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="pg-primary"
                        onClick={handleApply}
                        style={
                            isHighContrast
                                ? {
                                    backgroundColor: "#ffffff",
                                    color: "#120024",
                                    border: "3px solid #ffb3df",
                                    fontWeight: "950",
                                }
                                : {}
                        }
                    >
                        Apply
                    </button>
                </div>
            </section>
        </div>
    );
}
