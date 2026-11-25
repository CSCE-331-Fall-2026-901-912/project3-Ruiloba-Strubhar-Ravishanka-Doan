import React, { useEffect, useMemo, useRef, useState } from "react";
import { REWARD_DISCOUNTS, useRewards } from "../hooks/RewardsContext.jsx";

function expandOrderUnits(items = []) {
    const units = [];
    for (const item of items) {
        const qty = Math.max(0, Number(item.quantity) || 0);
        const toppingCount = Array.isArray(item.toppingIds)
            ? item.toppingIds.length
            : Array.isArray(item.toppingNames)
                ? item.toppingNames.length
                : 0;
        const drinkLabel = item.drinkName || item.item_name || `Drink #${item.drinkId}`;
        const toppingLabel =
            Array.isArray(item.toppingNames) && item.toppingNames.length > 0
                ? item.toppingNames.join(", ")
                : toppingCount > 0
                    ? `${toppingCount} topping(s)`
                    : "No toppings";

        for (let idx = 0; idx < qty; idx += 1) {
            units.push({
                unitId: `${item.key}::${idx}`,
                itemKey: item.key,
                unitIndex: idx,
                drinkId: item.drinkId,
                drinkName: drinkLabel,
                toppingIdsKey: Array.isArray(item.toppingIds) ? [...item.toppingIds].sort().join(",") : "",
                size: item.size || "M",
                toppingCount,
                toppingLabel,
            });
        }
    }
    return units;
}

export default function UseRewardsModal({
    isOpen,
    onClose,
    isHighContrast = false,
    order = null,
    onUpgradeDrinksToLarge = null,
}) {
    const { points, selectedDiscounts, setSelectedDiscounts } = useRewards();
    const [draftCounts, setDraftCounts] = useState({});
    const [selectedUpgradeIds, setSelectedUpgradeIds] = useState([]);
    const [savedUpgradeChoices, setSavedUpgradeChoices] = useState([]);
    const [notice, setNotice] = useState("");
    const [infoBanner, setInfoBanner] = useState("");

    const modalRef = useRef(null);
    const closeRef = useRef(null);
    const noticeRef = useRef(null);
    const wasOpenRef = useRef(false);

    const orderItems = order?.items || [];
    const drinkUnits = useMemo(() => expandOrderUnits(orderItems), [orderItems]);

    const totalDrinksCount = drinkUnits.length;
    const totalToppingsCount = useMemo(
        () => drinkUnits.reduce((sum, u) => sum + u.toppingCount, 0),
        [drinkUnits]
    );
    const existingLargeCount = useMemo(
        () => drinkUnits.filter((u) => u.size === "L").length,
        [drinkUnits]
    );
    const mediumUnits = useMemo(
        () => drinkUnits.filter((u) => u.size !== "L"),
        [drinkUnits]
    );

    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            setDraftCounts({ ...selectedDiscounts });

            const savedUpgradeCount = Number(selectedDiscounts.size_upgrade) || 0;
            if (savedUpgradeCount > 0) {
                const matchedIds = [];
                const usedUnitIds = new Set();

                // 1. Try matching previously saved choices by exact unitId first, then by drink signature (upgraded to L)
                for (const saved of savedUpgradeChoices) {
                    if (matchedIds.length >= savedUpgradeCount) break;
                    const exact = drinkUnits.find(
                        (u) => !usedUnitIds.has(u.unitId) && u.unitId === saved.unitId
                    );
                    if (exact) {
                        matchedIds.push(exact.unitId);
                        usedUnitIds.add(exact.unitId);
                        continue;
                    }
                    const bySignature = drinkUnits.find(
                        (u) =>
                            !usedUnitIds.has(u.unitId) &&
                            String(u.drinkId) === String(saved.drinkId) &&
                            u.toppingIdsKey === saved.toppingIdsKey &&
                            u.size === "L"
                    ) || drinkUnits.find(
                        (u) =>
                            !usedUnitIds.has(u.unitId) &&
                            String(u.drinkId) === String(saved.drinkId) &&
                            u.toppingIdsKey === saved.toppingIdsKey
                    );
                    if (bySignature) {
                        matchedIds.push(bySignature.unitId);
                        usedUnitIds.add(bySignature.unitId);
                    }
                }

                // 2. Fallback: pre-select existing Large drinks if no prior saved choice matched
                if (matchedIds.length < savedUpgradeCount) {
                    for (const u of drinkUnits) {
                        if (matchedIds.length >= savedUpgradeCount) break;
                        if (!usedUnitIds.has(u.unitId) && u.size === "L") {
                            matchedIds.push(u.unitId);
                            usedUnitIds.add(u.unitId);
                        }
                    }
                }

                setSelectedUpgradeIds(matchedIds);
            } else {
                setSelectedUpgradeIds([]);
            }

            setNotice("");
            setInfoBanner("");
        }
        wasOpenRef.current = isOpen;
    }, [isOpen, selectedDiscounts, savedUpgradeChoices, drinkUnits]);

    useEffect(() => {
        if (!isOpen) return;

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
    }, [isOpen, onClose]);

    useEffect(() => {
        if (notice && noticeRef.current) {
            noticeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [notice]);

    if (!isOpen) return null;

    const totalDraftCost = REWARD_DISCOUNTS.reduce(
        (sum, d) => sum + (Number(draftCounts[d.id]) || 0) * d.cost,
        0
    );
    const remainingPoints = Math.max(0, points - totalDraftCost);

    const sizeUpgradeCount = Number(draftCounts.size_upgrade) || 0;

    // Allow selecting any drink in the order (both Medium and already-Large drinks) up to sizeUpgradeCount
    const validDrinkIds = new Set(drinkUnits.map((u) => u.unitId));
    const effectiveSelectedUpgradeIds =
        sizeUpgradeCount > 0 && drinkUnits.length === sizeUpgradeCount
            ? drinkUnits.map((u) => u.unitId)
            : selectedUpgradeIds
                .filter((id) => validDrinkIds.has(id))
                .slice(0, sizeUpgradeCount);

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

    const getMaxAllowedForDiscount = (discountId) => {
        if (discountId === "size_upgrade") {
            return totalDrinksCount;
        }
        if (discountId === "free_topping") {
            return totalToppingsCount;
        }
        if (discountId === "bogo_50") {
            return Math.floor(totalDrinksCount / 2);
        }
        if (discountId === "free_drink") {
            return totalDrinksCount;
        }
        return Infinity;
    };

    const handleIncrement = (discount) => {
        const currentCount = Number(draftCounts[discount.id]) || 0;
        const nextCount = currentCount + 1;

        if (remainingPoints < discount.cost) {
            setNotice(
                `Not enough points for "${discount.name}" (${discount.cost} pts needed, ${remainingPoints} pts remaining).`
            );
            return;
        }

        if (discount.id === "size_upgrade") {
            if (totalDrinksCount === 0) {
                setNotice(
                    'Cannot apply "Free Size Upgrade": your order has 0 drinks. Add at least 1 drink to your order first.'
                );
                return;
            }
            if (nextCount > totalDrinksCount) {
                setNotice(
                    `Cannot apply ${nextCount} "Free Size Upgrade" discounts: you only have ${totalDrinksCount} drink${totalDrinksCount === 1 ? "" : "s"} in your order.`
                );
                return;
            }
        } else if (discount.id === "free_topping") {
            if (totalToppingsCount === 0) {
                setNotice(
                    'Cannot apply "Free Topping": none of the drinks in your order have toppings. Add a topping to a drink first.'
                );
                return;
            }
            if (nextCount > totalToppingsCount) {
                setNotice(
                    `Cannot apply ${nextCount} "Free Topping" discounts: your order only has ${totalToppingsCount} topping${totalToppingsCount === 1 ? "" : "s"} total.`
                );
                return;
            }
        } else if (discount.id === "bogo_50") {
            if (totalDrinksCount < 2) {
                setNotice(
                    `Cannot apply "Buy 2+ Drinks, Get One 50% Off": at least 2 drinks are required in your order (currently ${totalDrinksCount}).`
                );
                return;
            }
            const maxBogo = Math.floor(totalDrinksCount / 2);
            if (nextCount > maxBogo) {
                setNotice(
                    `Cannot apply ${nextCount} "Buy 2+ Drinks, Get One 50% Off" discounts: each requires 2 drinks (${totalDrinksCount} drink${totalDrinksCount === 1 ? "" : "s"} in order allows up to ${maxBogo}).`
                );
                return;
            }
        } else if (discount.id === "free_drink") {
            if (totalDrinksCount < 1) {
                setNotice(
                    'Cannot apply "Free Drink": at least 1 drink is required in your order.'
                );
                return;
            }
            if (nextCount > totalDrinksCount) {
                setNotice(
                    `Cannot apply ${nextCount} "Free Drink" discounts: you only have ${totalDrinksCount} drink${totalDrinksCount === 1 ? "" : "s"} in your order.`
                );
                return;
            }
        }

        setNotice("");
        setInfoBanner("");
        setDraftCounts((prev) => ({
            ...prev,
            [discount.id]: nextCount,
        }));
    };

    const handleDecrement = (discount) => {
        setNotice("");
        setInfoBanner("");
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

    const handleToggleDrinkUpgrade = (unit) => {
        if (sizeUpgradeCount <= 0) return;

        if (drinkUnits.length === sizeUpgradeCount) {
            setNotice("");
            return;
        }

        setNotice("");
        setSelectedUpgradeIds((prev) => {
            const cleaned = prev.filter((id) => validDrinkIds.has(id));
            if (cleaned.includes(unit.unitId)) {
                return cleaned.filter((id) => id !== unit.unitId);
            }
            if (cleaned.length >= sizeUpgradeCount) {
                if (sizeUpgradeCount === 1) {
                    return [unit.unitId];
                }
                setNotice(
                    `You can select up to ${sizeUpgradeCount} drink${sizeUpgradeCount === 1 ? "" : "s"} for your Free Size Upgrade discount. Deselect one first to pick another.`
                );
                return cleaned;
            }
            return [...cleaned, unit.unitId];
        });
    };

    const handleApply = () => {
        const nextSizeUpgrade = Number(draftCounts.size_upgrade) || 0;
        const nextFreeTopping = Number(draftCounts.free_topping) || 0;
        const nextBogo = Number(draftCounts.bogo_50) || 0;
        const nextFreeDrink = Number(draftCounts.free_drink) || 0;

        if (nextSizeUpgrade > totalDrinksCount) {
            setNotice(
                `Cannot apply ${nextSizeUpgrade} Free Size Upgrade(s): only ${totalDrinksCount} drink(s) in your order.`
            );
            return;
        }
        if (nextFreeTopping > totalToppingsCount) {
            setNotice(
                `Cannot apply ${nextFreeTopping} Free Topping(s): only ${totalToppingsCount} topping(s) in your order.`
            );
            return;
        }
        if (nextBogo > 0 && totalDrinksCount < 2) {
            setNotice(
                'Cannot apply "Buy 2+ Drinks, Get One 50% Off": at least 2 drinks are required in your order.'
            );
            return;
        }
        if (nextBogo > Math.floor(totalDrinksCount / 2)) {
            setNotice(
                `Cannot apply ${nextBogo} "Buy 2+ Drinks, Get One 50% Off" discount(s) for ${totalDrinksCount} drink(s).`
            );
            return;
        }
        if (nextFreeDrink > totalDrinksCount) {
            setNotice(
                `Cannot apply ${nextFreeDrink} Free Drink(s): at least ${nextFreeDrink} drink(s) are required in your order.`
            );
            return;
        }

        if (nextSizeUpgrade > 0) {
            const chosenUnitIds = [...effectiveSelectedUpgradeIds];

            if (chosenUnitIds.length < nextSizeUpgrade) {
                setNotice(
                    `Please select ${nextSizeUpgrade} drink${nextSizeUpgrade === 1 ? "" : "s"} directly below "Free Size Upgrade" before moving on.`
                );
                return;
            }

            const unitById = new Map(drinkUnits.map((u) => [u.unitId, u]));
            const mediumIdsToUpgrade = chosenUnitIds.filter(
                (id) => unitById.get(id)?.size !== "L"
            );

            const largeAfterUpgrade = existingLargeCount + mediumIdsToUpgrade.length;
            const stillShort = Math.max(0, nextSizeUpgrade - largeAfterUpgrade);
            if (stillShort > 0) {
                const extraMediumIds = mediumUnits
                    .filter((u) => !mediumIdsToUpgrade.includes(u.unitId))
                    .slice(0, stillShort)
                    .map((u) => u.unitId);
                mediumIdsToUpgrade.push(...extraMediumIds);
            }

            // Persist the user's chosen drinks so re-opening Use Rewards keeps them selected
            const persistedChoices = chosenUnitIds
                .map((id) => unitById.get(id))
                .filter(Boolean)
                .map((u) => ({
                    unitId: u.unitId,
                    drinkId: u.drinkId,
                    toppingIdsKey: u.toppingIdsKey,
                }));
            setSavedUpgradeChoices(persistedChoices);

            if (mediumIdsToUpgrade.length > 0 && typeof onUpgradeDrinksToLarge === "function") {
                onUpgradeDrinksToLarge(mediumIdsToUpgrade);
            }
        } else {
            setSavedUpgradeChoices([]);
        }

        setSelectedDiscounts({ ...draftCounts });
        setNotice("");
        setInfoBanner("");
        if (typeof onClose === "function") {
            onClose();
        }
    };

    const noticeStyle = isHighContrast
        ? {
            backgroundColor: "#1e003a",
            color: "#ffb3df",
            border: "3px solid #ffb3df",
            borderRadius: "8px",
            padding: "12px 16px",
            margin: "12px 0",
            fontSize: "20px",
            fontWeight: "900",
            lineHeight: "1.4",
        }
        : {
            backgroundColor: "#fff5f7",
            color: "#7a0924",
            border: "2px solid #9e1232",
            borderRadius: "8px",
            padding: "12px 16px",
            margin: "12px 0",
            fontSize: "19px",
            fontWeight: "800",
            lineHeight: "1.4",
        };

    const inlineUpgradeBoxStyle = isHighContrast
        ? {
            backgroundColor: "#120024",
            border: "3px solid #ffb3df",
            borderRadius: "10px",
            padding: "14px 16px",
            marginTop: "10px",
            color: "#ffffff",
        }
        : {
            backgroundColor: "#fdf7fb",
            border: "2px solid #572649",
            borderRadius: "10px",
            padding: "14px 16px",
            marginTop: "10px",
            color: "#3a1530",
        };

    const isAutoSelectedAll =
        sizeUpgradeCount > 0 && drinkUnits.length === sizeUpgradeCount;

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
                    style={{ fontSize: "24px" }}
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
                            style={{
                                fontSize: "26px",
                                ...(isHighContrast ? { color: "#ffb3df", fontWeight: "900" } : {}),
                            }}
                        >
                            REDEEM REWARDS
                        </p>
                        <h2
                            id="pg-use-rewards-title"
                            style={{
                                fontSize: "28px",
                                ...(isHighContrast ? { color: "#ffffff", fontWeight: "950" } : {}),
                            }}
                        >
                            Available Points: <span>{remainingPoints}</span>{" "}
                            <small style={{ fontSize: "22px" }}>(of {points} pts)</small>
                        </h2>
                    </div>
                    {totalDraftCost > 0 && (
                        <span
                            className="pg-use-rewards-spent"
                            style={{
                                fontSize: "22px",
                                ...(isHighContrast
                                    ? { color: "#ffb3df", fontWeight: "900" }
                                    : {}),
                            }}
                        >
                            −{totalDraftCost} pts selected
                        </span>
                    )}
                </div>

                {notice && (
                    <div
                        ref={noticeRef}
                        className="pg-alert pg-rewards-insufficient-alert"
                        role="alert"
                        aria-live="assertive"
                        style={noticeStyle}
                    >
                        ⚠ {notice}
                    </div>
                )}

                {infoBanner && !notice && (
                    <div
                        className="pg-alert"
                        role="status"
                        aria-live="polite"
                        style={noticeStyle}
                    >
                        {infoBanner}
                    </div>
                )}

                <div className="pg-use-rewards-list">
                    {REWARD_DISCOUNTS.map((discount) => {
                        const count = Number(draftCounts[discount.id]) || 0;
                        const isSelected = count > 0;
                        const maxAllowed = getMaxAllowedForDiscount(discount.id);
                        const canAddMore = remainingPoints >= discount.cost && count < maxAllowed;

                        return (
                            <React.Fragment key={discount.id}>
                                <div
                                    className={`pg-reward-option-row ${isSelected ? "selected" : ""} ${!canAddMore && !isSelected ? "unaffordable" : ""
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
                                                style={{
                                                    fontSize: "19px",
                                                    ...(isHighContrast
                                                        ? {
                                                            backgroundColor: isSelected ? "#ffb3df" : "#ffffff",
                                                            color: "#120024",
                                                            fontWeight: "950",
                                                        }
                                                        : {}),
                                                }}
                                            >
                                                {discount.cost} pts
                                            </span>
                                            <strong
                                                style={{
                                                    fontSize: "22px",
                                                    ...(isHighContrast
                                                        ? { color: isSelected ? "#ffb3df" : "#ffffff", fontWeight: "900" }
                                                        : {}),
                                                }}
                                            >
                                                {discount.name}
                                            </strong>
                                            {isSelected && (
                                                <span
                                                    className="pg-reward-selected-tag"
                                                    style={{
                                                        fontSize: "18px",
                                                        ...(isHighContrast
                                                            ? {
                                                                backgroundColor: "#ffffff",
                                                                color: "#120024",
                                                                fontWeight: "950",
                                                            }
                                                            : {}),
                                                    }}
                                                >
                                                    ✓ Selected ({count})
                                                </span>
                                            )}
                                        </div>
                                        <small
                                            style={{
                                                fontSize: "18px",
                                                display: "block",
                                                marginTop: "6px",
                                                ...(isHighContrast ? { color: "#ffffff", fontWeight: "700" } : {}),
                                            }}
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
                                            style={{
                                                fontSize: "22px",
                                                ...(isHighContrast
                                                    ? {
                                                        backgroundColor: "#120024",
                                                        color: "#ffffff",
                                                        border: "2px solid #ffffff",
                                                    }
                                                    : {}),
                                            }}
                                        >
                                            −
                                        </button>
                                        <span
                                            aria-live="polite"
                                            style={{
                                                fontSize: "22px",
                                                ...(isHighContrast
                                                    ? { color: "#ffffff", fontWeight: "950" }
                                                    : {}),
                                            }}
                                        >
                                            {count}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Increase ${discount.name} count`}
                                            aria-disabled={!canAddMore}
                                            onClick={() => handleIncrement(discount)}
                                            style={{
                                                fontSize: "22px",
                                                opacity: canAddMore ? 1 : 0.55,
                                                ...(isHighContrast
                                                    ? {
                                                        backgroundColor: "#120024",
                                                        color: "#ffffff",
                                                        border: "2px solid #ffffff",
                                                    }
                                                    : {}),
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Inline Drink Picker directly below Free Size Upgrade */}
                                {discount.id === "size_upgrade" && sizeUpgradeCount > 0 && drinkUnits.length > 0 && (
                                    <div style={inlineUpgradeBoxStyle} aria-live="polite">
                                        <strong
                                            style={{
                                                display: "block",
                                                fontSize: "20px",
                                                marginBottom: "6px",
                                                ...(isHighContrast ? { color: "#ffb3df" } : { color: "#3a1530" }),
                                            }}
                                        >
                                            {isAutoSelectedAll
                                                ? "Automatically Selected for Free Size Upgrade:"
                                                : `Required: Choose ${sizeUpgradeCount} Drink${sizeUpgradeCount === 1 ? "" : "s"} for Free Size Upgrade (${effectiveSelectedUpgradeIds.length}/${sizeUpgradeCount} selected)`}
                                        </strong>
                                        <p
                                            style={{
                                                fontSize: "17px",
                                                margin: "0 0 10px 0",
                                                ...(isHighContrast ? { color: "#ffffff" } : { color: "#3a1530" }),
                                            }}
                                        >
                                            {isAutoSelectedAll
                                                ? "Your drink below will receive the Free Size Upgrade (upgraded to Large if Medium, or $0.50 off if already Large) when you click Apply:"
                                                : `Select ${sizeUpgradeCount} drink${sizeUpgradeCount === 1 ? "" : "s"} below (Medium drinks will be upgraded to Large; already-Large drinks still receive the $0.50 upgrade discount):`}
                                        </p>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            {drinkUnits.map((unit, idx) => {
                                                const isAlreadyLarge = unit.size === "L";
                                                const isPickedForUpgrade = effectiveSelectedUpgradeIds.includes(unit.unitId);

                                                const btnStyle = isHighContrast
                                                    ? {
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                        width: "100%",
                                                        padding: "12px 16px",
                                                        borderRadius: "8px",
                                                        fontSize: "18px",
                                                        fontWeight: "900",
                                                        textAlign: "left",
                                                        backgroundColor: isPickedForUpgrade ? "#ffb3df" : "#1e003a",
                                                        color: isPickedForUpgrade ? "#120024" : "#ffffff",
                                                        border: isPickedForUpgrade ? "4px solid #ffffff" : "2px dashed #ffffff",
                                                        boxShadow: isPickedForUpgrade ? "0 0 0 2px #ffb3df" : "none",
                                                        cursor: "pointer",
                                                    }
                                                    : {
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                        width: "100%",
                                                        padding: "12px 16px",
                                                        borderRadius: "8px",
                                                        fontSize: "18px",
                                                        fontWeight: isPickedForUpgrade ? "800" : "600",
                                                        textAlign: "left",
                                                        backgroundColor: isPickedForUpgrade ? "#572649" : "#ffffff",
                                                        color: isPickedForUpgrade ? "#ffffff" : "#3a1530",
                                                        border: isPickedForUpgrade
                                                            ? "3px solid #3a1530"
                                                            : "2px solid #765c6f",
                                                        cursor: "pointer",
                                                    };

                                                const pillStyle = isHighContrast
                                                    ? {
                                                        display: "inline-block",
                                                        padding: "6px 12px",
                                                        borderRadius: "999px",
                                                        fontSize: "16px",
                                                        fontWeight: "950",
                                                        whiteSpace: "nowrap",
                                                        backgroundColor: isPickedForUpgrade ? "#120024" : "#1e003a",
                                                        color: isPickedForUpgrade ? "#ffffff" : "#ffb3df",
                                                        border: isPickedForUpgrade ? "2px solid #120024" : "2px solid #ffb3df",
                                                    }
                                                    : {
                                                        display: "inline-block",
                                                        padding: "6px 12px",
                                                        borderRadius: "999px",
                                                        fontSize: "16px",
                                                        fontWeight: "800",
                                                        whiteSpace: "nowrap",
                                                        backgroundColor: isPickedForUpgrade ? "#ffffff" : "#f5ebf2",
                                                        color: "#3a1530",
                                                        border: "2px solid #572649",
                                                    };

                                                return (
                                                    <button
                                                        key={unit.unitId}
                                                        type="button"
                                                        className={`pg-upgrade-drink-choice ${isPickedForUpgrade ? "selected" : ""}`}
                                                        aria-pressed={isPickedForUpgrade}
                                                        onClick={() => handleToggleDrinkUpgrade(unit)}
                                                        style={btnStyle}
                                                    >
                                                        <span
                                                            style={
                                                                isHighContrast
                                                                    ? {
                                                                        color: isPickedForUpgrade ? "#120024" : "#ffffff",
                                                                        fontWeight: "900",
                                                                    }
                                                                    : {}
                                                            }
                                                        >
                                                            #{idx + 1} {unit.drinkName} ({unit.size === "L" ? "Large" : "Medium"} · {unit.toppingLabel})
                                                        </span>
                                                        <span style={pillStyle}>
                                                            {isPickedForUpgrade
                                                                ? isAlreadyLarge
                                                                    ? "✓ Selected (Large Discount)"
                                                                    : "✓ Selected (Upgrade to Large)"
                                                                : "Select Drink"}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="pg-use-rewards-footer">
                    <button
                        type="button"
                        className="pg-rewards-cancel-btn"
                        onClick={onClose}
                        style={{
                            fontSize: "22px",
                            ...(isHighContrast
                                ? {
                                    backgroundColor: "#1e003a",
                                    color: "#ffffff",
                                    border: "3px solid #ffffff",
                                    fontWeight: "900",
                                }
                                : {}),
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="pg-primary"
                        onClick={handleApply}
                        style={{
                            fontSize: "22px",
                            ...(isHighContrast
                                ? {
                                    backgroundColor: "#ffffff",
                                    color: "#120024",
                                    border: "3px solid #ffb3df",
                                    fontWeight: "950",
                                }
                                : {}),
                        }}
                    >
                        Apply
                    </button>
                </div>
            </section>
        </div>
    );
}
