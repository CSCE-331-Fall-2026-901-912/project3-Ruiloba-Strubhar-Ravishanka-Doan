import React, { createContext, useContext, useState } from 'react';

export const REWARD_DISCOUNTS = [
    {
        id: 'size_upgrade',
        name: 'Free Size Upgrade',
        cost: 25,
        description: 'Chooses any Medium drink to upgrade to Large (+$0.50 off)',
    },
    {
        id: 'free_topping',
        name: 'Free Topping',
        cost: 50,
        description: 'Free topping for one drink (chooses cheapest topping)',
    },
    {
        id: 'bogo_50',
        name: 'Buy 2+ Drinks, Get One 50% Off',
        cost: 75,
        description: '50% off the lowest-priced drink including its toppings',
    },
    {
        id: 'free_drink',
        name: 'Free Drink',
        cost: 100,
        description: 'Cheapest base drink free (does not include toppings)',
    },
];

export function calculateEarnedPoints(items = []) {
    let totalDrinks = 0;
    let totalToppings = 0;

    for (const item of items) {
        const qty = Math.max(0, Number(item.quantity) || 0);
        const toppingCount = Array.isArray(item.toppingIds)
            ? item.toppingIds.length
            : Array.isArray(item.toppingNames)
                ? item.toppingNames.length
                : 0;

        totalDrinks += qty;
        totalToppings += toppingCount * qty;
    }

    let points = totalDrinks * 10 + totalToppings * 2;
    if (totalDrinks >= 5) {
        points += 20;
    }
    return points;
}

export function calculateDiscountAmount(items = [], selectedDiscounts = {}, toppingsCatalog = []) {
    if (!Array.isArray(items) || items.length === 0) return 0;

    const toppingPriceById = new Map(
        (toppingsCatalog || []).map(t => [Number(t.itemid), Number(t.item_cost) || 0])
    );

    const expandedDrinks = [];
    for (const item of items) {
        const qty = Math.max(0, Number(item.quantity) || 0);
        const toppingIds = Array.isArray(item.toppingIds) ? item.toppingIds.map(Number) : [];
        const toppingPrices = toppingIds
            .map(id => toppingPriceById.get(id) ?? 0.75)
            .sort((a, b) => a - b);

        const toppingsSum = toppingPrices.reduce((sum, p) => sum + p, 0);
        const sizeUpcharge = item.size === 'L' ? 0.5 : 0;
        const totalUnitPrice =
            Number(item.unitPrice) ||
            (Number(item.basePrice) || 0) + toppingsSum + sizeUpcharge;
        const baseDrinkOnlyPrice = Math.max(0, totalUnitPrice - toppingsSum - sizeUpcharge);

        for (let i = 0; i < qty; i += 1) {
            expandedDrinks.push({
                size: item.size,
                totalUnitPrice,
                baseDrinkOnlyPrice,
                toppingPrices: [...toppingPrices],
            });
        }
    }

    let totalDiscount = 0;

    // 1. Free Drink (100 pts) - cheapest base drink (excluding toppings)
    const freeDrinkCount = Math.min(
        Number(selectedDiscounts.free_drink) || 0,
        expandedDrinks.length
    );
    if (freeDrinkCount > 0) {
        const sortedByBase = [...expandedDrinks].sort(
            (a, b) => a.baseDrinkOnlyPrice - b.baseDrinkOnlyPrice
        );
        for (let i = 0; i < freeDrinkCount; i += 1) {
            totalDiscount += sortedByBase[i].baseDrinkOnlyPrice;
        }
    }

    // 2. Buy 2+ Drinks get one 50% off (75 pts) - 50% off lowest priced drink including toppings
    const maxBogoCount = Math.floor(expandedDrinks.length / 2);
    const bogoCount = Math.min(Number(selectedDiscounts.bogo_50) || 0, maxBogoCount);
    if (bogoCount > 0) {
        const sortedByTotal = [...expandedDrinks].sort(
            (a, b) => a.totalUnitPrice - b.totalUnitPrice
        );
        for (let i = 0; i < bogoCount; i += 1) {
            totalDiscount += sortedByTotal[i].totalUnitPrice * 0.5;
        }
    }

    // 3. Free Topping (50 pts) - cheapest individual toppings across drinks in the order
    const allToppingPrices = expandedDrinks
        .flatMap(d => d.toppingPrices)
        .sort((a, b) => a - b);
    const freeToppingCount = Math.min(
        Number(selectedDiscounts.free_topping) || 0,
        allToppingPrices.length
    );
    for (let i = 0; i < freeToppingCount; i += 1) {
        totalDiscount += allToppingPrices[i];
    }

    // 4. Free Size Upgrade to Large (25 pts) - $0.50 off per Large drink covered by upgrade
    const largeDrinkCount = expandedDrinks.filter(d => d.size === 'L').length;
    const sizeUpgradeCount = Math.min(
        Number(selectedDiscounts.size_upgrade) || 0,
        largeDrinkCount
    );
    totalDiscount += sizeUpgradeCount * 0.5;

    return Math.round(totalDiscount * 100) / 100;
}

function formatAuthErrorMessage(mode, status, data, rawText = '') {
    const raw = String(data?.error || data?.message || rawText || '').trim();
    const code = String(data?.code || '').toLowerCase();
    const lower = raw.toLowerCase();

    if (mode === 'signup') {
        if (
            status === 409 ||
            code === 'email_exists' ||
            lower.includes('already exists') ||
            lower.includes('already used') ||
            lower.includes('already registered') ||
            lower.includes('in use') ||
            lower.includes('duplicate')
        ) {
            return 'This email is already used. Please log in or use a different email address.';
        }
        return raw || `Unable to create account right now (HTTP ${status}).`;
    }

    if (
        status === 404 ||
        code === 'email_not_found' ||
        lower.includes('not found') ||
        lower.includes('does not exist') ||
        lower.includes('no account') ||
        lower.includes('unknown email')
    ) {
        return 'This email does not exist. Please check your email or create a new account.';
    }

    if (
        status === 401 ||
        code === 'wrong_password' ||
        code === 'invalid_password' ||
        lower.includes('wrong password') ||
        lower.includes('incorrect password') ||
        lower.includes('invalid password') ||
        lower.includes('invalid credentials') ||
        lower.includes('password')
    ) {
        return 'Wrong password. Please try again.';
    }

    return raw || `Unable to sign in right now (HTTP ${status}).`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

const RewardsContext = createContext(null);

export function RewardsProvider({ children }) {
    const [user, setUser] = useState(null);
    const [selectedDiscounts, setSelectedDiscounts] = useState({});
    const [hasDismissedEntryModal, setHasDismissedEntryModal] = useState(false);

    const points = user ? Math.max(0, Math.min(1000, Number(user.points) || 0)) : 0;

    const usedPoints = REWARD_DISCOUNTS.reduce(
        (sum, d) => sum + (Number(selectedDiscounts[d.id]) || 0) * d.cost,
        0
    );

    async function loginWithForm({ mode = 'login', email, password }) {
        let response;
        try {
            response = await fetchWithTimeout('/api/rewards/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, email, password }),
            });
        } catch (networkErr) {
            if (networkErr?.name === 'AbortError') {
                throw new Error('Server request timed out. Please check your backend /api/rewards/auth route.');
            }
            throw new Error('Could not reach the server. Please make sure the backend server is running.');
        }

        const rawText = await response.text();
        let data = {};
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(formatAuthErrorMessage(mode, response.status, data, rawText));
        }
        if (!data?.user) {
            throw new Error('Server did not return account details. Please check the backend /api/rewards/auth route.');
        }
        setUser(data.user);
        setSelectedDiscounts({});
        return data.user;
    }

    async function loginWithGoogleToken(googleCredential) {
        let response;
        try {
            response = await fetchWithTimeout('/api/rewards/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'login', googleCredential }),
            });
        } catch (networkErr) {
            if (networkErr?.name === 'AbortError') {
                throw new Error('Google sign-in request timed out. Please try again.');
            }
            throw new Error('Could not reach the server. Please make sure the backend server is running.');
        }

        const rawText = await response.text();
        let data = {};
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(formatAuthErrorMessage('login', response.status, data, rawText));
        }
        if (!data?.user) {
            throw new Error('Google sign-in failed: server did not return account details.');
        }
        setUser(data.user);
        setSelectedDiscounts({});
        return data.user;
    }

    async function syncPoints(nextPoints) {
        if (!user?.email) return null;
        const clamped = Math.max(0, Math.min(1000, Math.round(Number(nextPoints) || 0)));
        const response = await fetch('/api/rewards/points', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, points: clamped }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to save points.');
        }
        setUser(data.user);
        return data.user;
    }

    function logout() {
        setUser(null);
        setSelectedDiscounts({});
    }

    return (
        <RewardsContext.Provider
            value={{
                user,
                points,
                usedPoints,
                selectedDiscounts,
                setSelectedDiscounts,
                hasDismissedEntryModal,
                setHasDismissedEntryModal,
                loginWithForm,
                loginWithGoogleToken,
                syncPoints,
                logout,
            }}
        >
            {children}
        </RewardsContext.Provider>
    );
}

export function useRewards() {
    const ctx = useContext(RewardsContext);
    if (!ctx) {
        throw new Error('useRewards must be used within a RewardsProvider');
    }
    return ctx;
}
