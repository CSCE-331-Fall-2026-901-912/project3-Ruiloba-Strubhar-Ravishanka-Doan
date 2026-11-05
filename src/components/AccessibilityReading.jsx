import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the shared accessibility context
const AccessibilityContext = createContext(null);

/**
 * Global provider to wrap around your application entry tree in main.jsx
 */
export function AccessibilityProvider({ children }) {
    const [narratorMessage, setNarratorMessage] = useState('');

    // Clear announcements after they have been read to allow repeating the same message
    useEffect(() => {
        if (narratorMessage) {
            const timer = setTimeout(() => setNarratorMessage(''), 1000);
            return () => clearTimeout(timer);
        }
    }, [narratorMessage]);

    return (
        <AccessibilityContext.Provider value={{ narratorMessage, setNarratorMessage }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

/**
 * Safe custom hook consumed by your custom pages and dropdown filters
 */
export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) {
        // Graceful fallback helper if components render outside the main wrapper
        return {
            narratorMessage: '',
            setNarratorMessage: () => { }
        };
    }
    return context;
}

/**
 * Shared screen reader portal element rendered at the application core root
 */
export default function AccessibilityReading() {
    const { narratorMessage } = useAccessibility();

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: '0',
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                border: '0',
                whiteSpace: 'nowrap'
            }}
        >
            {narratorMessage}
        </div>
    );
}
