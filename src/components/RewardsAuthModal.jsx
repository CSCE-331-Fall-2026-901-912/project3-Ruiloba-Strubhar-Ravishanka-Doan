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
    const [googleClientId, setGoogleClientId] = useState(
        () =>
            import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
            window.__GOOGLE_CLIENT_ID__ ||
            ''
    );

    const modalRef = useRef(null);
    const loginTabRef = useRef(null);
    const errorRef = useRef(null);

    // Fetch GOOGLE_CLIENT_ID from backend config with retry in case Express starts slightly after Vite
    useEffect(() => {
        if (!isOpen || googleClientId) return undefined;
        let active = true;
        let attempt = 0;
        let retryTimer = null;

        const loadConfig = () => {
            fetch('/api/rewards/config')
                .then(res => (res.ok ? res.json() : Promise.reject(new Error('Config unavailable'))))
                .then(data => {
                    if (!active) return;
                    if (data?.googleClientId) {
                        setGoogleClientId(data.googleClientId);
                    } else if (attempt < 5) {
                        attempt += 1;
                        retryTimer = setTimeout(loadConfig, 800);
                    }
                })
                .catch(() => {
                    if (active && attempt < 5) {
                        attempt += 1;
                        retryTimer = setTimeout(loadConfig, 800);
                    }
                });
        };

        loadConfig();
        return () => {
            active = false;
            if (retryTimer) clearTimeout(retryTimer);
        };
    }, [isOpen, googleClientId]);

    // Only run initial focus & clear error when modal transitions from closed -> open
    useEffect(() => {
        if (!isOpen) return undefined;
        const previouslyFocused = document.activeElement;
        setError('');
        const timer = setTimeout(() => {
            loginTabRef.current?.focus();
        }, 30);

        return () => {
            clearTimeout(timer);
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus();
            }
        };
    }, [isOpen]);

    // Escape key listener (does NOT reset error when submitting toggles!)
    useEffect(() => {
        if (!isOpen) return undefined;
        const handleKey = event => {
            if (event.key === 'Escape' && !submitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose, submitting]);

    // Scroll alert into view whenever an error message is set
    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [error]);

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
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setError('Please enter your email address.');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await loginWithForm({ mode, email: trimmedEmail, password });
            setEmail('');
            setPassword('');
            onClose();
        } catch (err) {
            setError(err?.message || 'Unable to sign in right now.');
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
            setError(err?.message || 'Google sign-in failed.');
        } finally {
            setSubmitting(false);
        }
    }

    const getNormalTabStyle = (isSelected, minWidth) =>
        isHighContrast
            ? {
                padding: '10px 24px',
                fontSize: '1.05rem',
                minWidth,
            }
            : {
                padding: '10px 24px',
                fontSize: '1.05rem',
                minWidth,
                backgroundColor: isSelected ? '#572649' : '#ffffff',
                color: isSelected ? '#ffffff' : '#3a1530',
                border: isSelected ? '3px solid #3a1530' : '2px solid #765c6f',
                fontWeight: isSelected ? '800' : '600',
                borderRadius: '8px',
                boxShadow: isSelected ? '0 3px 8px rgba(87, 38, 73, 0.25)' : 'none',
            };

    const alertStyle = isHighContrast
        ? {
            display: 'block',
            backgroundColor: '#1e003a',
            color: '#ffb3df',
            border: '3px solid #ffb3df',
            borderRadius: '8px',
            padding: '12px 16px',
            margin: '12px 0',
            fontSize: '19px',
            fontWeight: '900',
            lineHeight: '1.4',
            textAlign: 'left',
        }
        : {
            display: 'block',
            backgroundColor: '#fff5f7',
            color: '#7a0924',
            border: '2px solid #9e1232',
            borderRadius: '8px',
            padding: '12px 16px',
            margin: '12px 0',
            fontSize: '18px',
            fontWeight: '800',
            lineHeight: '1.4',
            textAlign: 'left',
        };

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
                style={{
                    position: 'relative',
                    width: 'min(94vw, 640px)',
                    maxWidth: '640px',
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                }}
            >
                <button
                    className="pg-close"
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    aria-label="Close rewards sign in dialog"
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        left: 'auto',
                        margin: 0,
                    }}
                >
                    ×
                </button>

                <p className="pg-eyebrow" style={{ fontSize: "20px" }}>
                    PEARL GARDEN REWARDS
                </p>

                <h2 id="pg-rewards-auth-title" style={{ textAlign: 'center' }}>
                    {mode === 'login' ? 'Log In to Earn & Use Points' : 'Create Your Rewards Account'}
                </h2>
                <p className="pg-rewards-auth-subtitle" style={{ textIndent: '2em' }}>
                    Sign in with Google or your Google email and password to earn points on every drink and topping, and redeem rewards at checkout.
                </p>

                <div
                    className="pg-rewards-auth-tabs"
                    role="tablist"
                    aria-label="Account options"
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '14px',
                        margin: '16px 0',
                    }}
                >
                    <button
                        ref={loginTabRef}
                        type="button"
                        role="tab"
                        aria-selected={mode === 'login'}
                        className={mode === 'login' ? 'active' : ''}
                        style={{ ...getNormalTabStyle(mode === 'login', '140px'), fontSize: '20px' }}
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
                        style={{ ...getNormalTabStyle(mode === 'signup', '160px'), fontSize: '20px' }}
                        onClick={() => {
                            setMode('signup');
                            setError('');
                        }}
                    >
                        Create Account
                    </button>
                </div>

                <div
                    className="pg-rewards-google-wrap"
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        overflow: 'hidden',
                        margin: '18px 0 22px',
                    }}
                >
                    <div
                        style={{
                            transform: 'scale(1.25)',
                            transformOrigin: 'center',
                        }}
                    >
                        <GoogleSignInButton
                            clientId={googleClientId}
                            onCredential={handleGoogleCredential}
                            onError={msg => setError(msg)}
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="pg-rewards-auth-form" noValidate>
                    <div className="pg-rewards-field">
                        <label htmlFor="pg-rewards-email">Google Email Address</label>
                        <input
                            id="pg-rewards-email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@gmail.com"
                            value={email}
                            disabled={submitting}
                            onChange={e => setEmail(e.target.value)}
                            style={{ width: '100%', boxSizing: 'border-box' }}
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
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    {error && (
                        <div
                            ref={errorRef}
                            className="pg-alert pg-rewards-auth-error"
                            role="alert"
                            aria-live="assertive"
                            style={alertStyle}
                        >
                            ⚠ {error}
                        </div>
                    )}

                    <div className="pg-rewards-auth-actions">
                        <button
                            type="submit"
                            className="pg-primary"
                            style={{ fontSize: "24px", width: '100%', boxSizing: 'border-box' }}
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
                                style={{ fontSize: "26px", fontWeight: "bold", width: '100%', boxSizing: 'border-box' }}
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
