import React, { useState } from "react";
import { REWARD_DISCOUNTS, useRewards } from "../hooks/RewardsContext.jsx";

export default function RewardsBarAndInfo({ isHighContrast = false }) {
    const { user, points } = useRewards();
    const [isOpen, setIsOpen] = useState(true);

    const clampedPoints = Math.max(0, Math.min(1000, Number(points) || 0));
    const percentage = Math.round((clampedPoints / 1000) * 100);

    return (
        <section
            aria-label="Rewards points progress and available discounts"
            className={`pg-rewards-banner ${isHighContrast ? "high-contrast" : ""}`}
            style={
                isHighContrast
                    ? {
                        backgroundColor: "#1e003a",
                        border: "4px solid #ffffff",
                        color: "#ffffff",
                    }
                    : {}
            }
        >
            {/* Top Point Bar (min 0, max 1000) */}
            <div className="pg-rewards-bar-header">
                <div>
                    <p
                        className="pg-eyebrow"
                        style={{
                            fontSize: "26px",
                            ...(isHighContrast ? { color: "#ffb3df", fontWeight: "900" } : {})
                        }}
                    >
                        PEARL GARDEN REWARDS
                    </p>

                    <h2
                        className="pg-rewards-points-heading"
                        style={isHighContrast ? { color: "#ffffff", fontWeight: "950" } : {}}
                    >
                        {user ? `${clampedPoints} / 1,000 Points` : "0 / 1,000 Points (Log in to earn & use points)"}
                    </h2>
                </div>
                {user && (
                    <span
                        className="pg-rewards-member-badge"
                        style={
                            isHighContrast
                                ? {
                                    backgroundColor: "#ffffff",
                                    color: "#120024",
                                    border: "2px solid #ffb3df",
                                    fontWeight: "900",
                                }
                                : {}
                        }
                    >
                        {user.email}
                    </span>
                )}
            </div>

            <div
                className="pg-rewards-progress-track"
                role="progressbar"
                aria-label="Reward points progress"
                aria-valuemin={0}
                aria-valuemax={1000}
                aria-valuenow={clampedPoints}
                style={
                    isHighContrast
                        ? {
                            backgroundColor: "#120024",
                            border: "3px solid #ffffff",
                        }
                        : {}
                }
            >
                <div
                    className="pg-rewards-progress-fill"
                    style={{
                        width: `${percentage}%`,
                        ...(isHighContrast
                            ? { backgroundColor: "#ffb3df" }
                            : {}),
                    }}
                />
            </div>

            <div
                className="pg-rewards-scale-labels"
                aria-hidden="true"
                style={{ fontSize: "20px" }}
            >
                <span>0 pts</span>
                <span>250 pts</span>
                <span>500 pts</span>
                <span>750 pts</span>
                <span>1,000 pts</span>
            </div>


            {/* Collapsible Box Below Point Bar (starts open by default) */}
            <div
                className="pg-rewards-info-box"
                style={
                    isHighContrast
                        ? {
                            backgroundColor: "#120024",
                            border: "3px solid #ffffff",
                        }
                        : {}
                }
            >
                <div className="pg-rewards-info-header">
                    <div>
                        <strong
                            style={{
                                fontSize: "20px",
                                ...(isHighContrast ? { color: "#ffffff", fontWeight: "900" } : {})
                            }}
                        >
                            Offered Rewards Discounts
                        </strong>

                        <p
                            className="pg-rewards-info-note"
                            style={isHighContrast ? { color: "#ffb3df", fontWeight: "800" } : {}}
                        >
                            You can claim your rewards during the checkout process using the "Use Rewards" button on your ticket.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="pg-rewards-toggle-btn"
                        aria-expanded={isOpen}
                        aria-controls="pg-rewards-discount-list"
                        onClick={() => setIsOpen((prev) => !prev)}
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
                        {isOpen ? "Minimize ▲" : "Show Rewards ▼"}
                    </button>
                </div>

                {isOpen && (
                    <ul
                        id="pg-rewards-discount-list"
                        className="pg-rewards-discount-grid"
                    >
                        {REWARD_DISCOUNTS.map((discount) => (
                            <li
                                key={discount.id}
                                className="pg-rewards-discount-card"
                                style={
                                    isHighContrast
                                        ? {
                                            backgroundColor: "#1e003a",
                                            border: "2px solid #ffffff",
                                        }
                                        : {}
                                }
                            >
                                <span
                                    className="pg-rewards-cost-pill"
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
                                    {discount.cost} pts
                                </span>
                                <strong
                                    style={isHighContrast ? { color: "#ffb3df", fontWeight: "900" } : {}}
                                >
                                    {discount.name}
                                </strong>
                                <small
                                    style={isHighContrast ? { color: "#ffffff", fontWeight: "700" } : {}}
                                >
                                    {discount.description}
                                </small>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
