import React, { useEffect, useRef, useState } from 'react';
import GoogleSignInButton from './GoogleSignInButton.jsx';
import { useRewards } from '../hooks/RewardsContext.jsx';

export default function RewardsAuthModal({
    isOpen,
    onClose,
    allowSkip = false,
    isHighContrast = false,
}) {
    const { loginWithForm, loginWithGoogleToken } = useRewards();
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const modalRef = useRef(null);
    const firstInputRef = useRef(null);

    const googleClientId =
        import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
        window.__GOOGLE_CLIENT_ID__ ||
        '';

    useEffect(() => {
        if (!isOpen) return undefined;
        const previouslyFocused = document.activeElement;
        setError('');
        const timer = setTimeout(() => {
            firstInputRef.current?.focus();
        }, 30);

        const handleKey = event => {
            if (event.key === 'Escape' && !submitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', handleKey);
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus();
            }
        };
    }, [isOpen, onClose, submitting]);

    const handleModalKeyDown = event => {
        if (event.key !== 'Tab' || !modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

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

    if (!isOpen) return null;

    async function handleSubmit(event) {
        event.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError('');
        try {
            await loginWithForm({ mode, email, password });
            setEmail('');
            setPassword('');
            onClose();
        } catch (err) {
            setError(err.message || 'Unable to sign in right now.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleGoogleCredential(credential) {
        if (submitting) return;
        setSubmitting(true);
        setError('');
        try {
            await loginWithGoogleToken(credential);
            onClose();
        } catch (err) {
            setError(err.message || 'Google sign-in failed.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="pg-modal-backdrop pg-rewards-auth-backdrop"
            onMouseDown={event => {
                if (event.target === event.currentTarget && !submitting) onClose();
            }}
        >
            <section
                ref={modalRef}
                onKeyDown={handleModalKeyDown}
                className={`pg-modal pg-rewards-auth-modal ${isHighContrast ? 'high-contrast' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pg-rewards-auth-title"
            >
                <button
                    className="pg-close"
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    aria-label="Close rewards sign in dialog"
                >
                    ×
                </button>

                <p className="pg-eyebrow">PEARL GARDEN REWARDS</p>
                <h2 id="pg-rewards-auth-title">
                    {mode === 'login' ? 'Log In to Earn & Use Points' : 'Create Your Rewards Account'}
                </h2>
                <p className="pg-rewards-auth-subtitle">
                    Sign in with your Google email and password to earn points on every drink and topping, and redeem rewards at checkout.
                </p>

                <div className="pg-rewards-auth-tabs" role="tablist" aria-label="Account options">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'login'}
                        className={mode === 'login' ? 'active' : ''}
                        onClick={() => {
                            setMode('login');
                            setError('');
                        }}
                    >
                        Log In
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === 'signup'}
                        className={mode === 'signup' ? 'active' : ''}
                        onClick={() => {
                            setMode('signup');
                            setError('');
                        }}
                    >
                        Create Account
                    </button>
                </div>

                <div className="pg-rewards-google-wrap" style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                    <GoogleSignInButton
                        clientId={googleClientId}
                        onCredential={handleGoogleCredential}
                        onError={msg => setError(msg)}
                    />
                </div>

                <form onSubmit={handleSubmit} className="pg-rewards-auth-form" noValidate>
                    <div className="pg-rewards-field">
                        <label htmlFor="pg-rewards-email">Google Email Address</label>
                        <input
                            ref={firstInputRef}
                            id="pg-rewards-email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@gmail.com"
                            value={email}
                            disabled={submitting}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="pg-rewards-field">
                        <label htmlFor="pg-rewards-password">Password</label>
                        <input
                            id="pg-rewards-password"
                            type="password"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            required
                            placeholder="Enter password"
                            value={password}
                            disabled={submitting}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="pg-alert pg-rewards-auth-error" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="pg-rewards-auth-actions">
                        <button
                            type="submit"
                            className="pg-primary"
                            disabled={submitting}
                        >
                            {submitting
                                ? 'Please wait…'
                                : mode === 'login'
                                    ? 'Log In'
                                    : 'Create Account'}
                        </button>

                        {allowSkip && (
                            <button
                                type="button"
                                className="pg-rewards-skip-btn"
                                disabled={submitting}
                                onClick={onClose}
                            >
                                Skip for Now
                            </button>
                        )}
                    </div>
                </form>
            </section>
        </div>
    );
}
