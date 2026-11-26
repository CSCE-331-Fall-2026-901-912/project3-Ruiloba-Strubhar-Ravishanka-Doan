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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeField, setActiveField] = useState(null); // 'email' | 'password' | 'confirmPassword' | null
    const [isUpperCase, setIsUpperCase] = useState(false);
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
        setActiveField(null);
        setIsUpperCase(false);
        setShowPassword(false);
        setShowConfirmPassword(false);
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
                setActiveField(null);
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

    const handleVirtualKeyPress = char => {
        const outputChar = isUpperCase ? char.toUpperCase() : char;
        if (activeField === 'email') {
            setEmail(prev => prev + outputChar);
        } else if (activeField === 'password') {
            setPassword(prev => prev + outputChar);
        } else if (activeField === 'confirmPassword') {
            setConfirmPassword(prev => prev + outputChar);
        }
    };

    const handleVirtualBackspace = () => {
        if (activeField === 'email') {
            setEmail(prev => prev.slice(0, -1));
        } else if (activeField === 'password') {
            setPassword(prev => prev.slice(0, -1));
        } else if (activeField === 'confirmPassword') {
            setConfirmPassword(prev => prev.slice(0, -1));
        }
    };

    const handleCloseModal = () => {
        setActiveField(null);
        setIsUpperCase(false);
        setShowPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    if (!isOpen) return null;

    const passwordsMismatch =
        mode === 'signup' &&
        confirmPassword.length > 0 &&
        password !== confirmPassword;

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
        if (mode === 'signup') {
            if (!confirmPassword) {
                setError('Please confirm your password.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match. Please re-enter your password.');
                return;
            }
        }
        setSubmitting(true);
        setError('');
        try {
            await loginWithForm({ mode, email: trimmedEmail, password });
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setShowConfirmPassword(false);
            setActiveField(null);
            setIsUpperCase(false);
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
            setActiveField(null);
            setIsUpperCase(false);
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

    const togglePasswordButtonStyle = isHighContrast
        ? {
            padding: '8px 14px',
            minHeight: '44px',
            minWidth: '72px',
            fontSize: '16px',
            fontWeight: '900',
            borderRadius: '8px',
            backgroundColor: '#1e003a',
            color: '#ffffff',
            border: '2px solid #ffffff',
            cursor: 'pointer',
            flexShrink: 0,
        }
        : {
            padding: '8px 14px',
            minHeight: '44px',
            minWidth: '72px',
            fontSize: '16px',
            fontWeight: '700',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            color: '#3a1530',
            border: '2px solid #765c6f',
            cursor: 'pointer',
            flexShrink: 0,
        };

    const virtualKeyStyle = isHighContrast
        ? {
            flex: 1,
            padding: '10px 4px',
            fontSize: '18px',
            fontWeight: '900',
            borderRadius: '6px',
            backgroundColor: '#1e003a',
            color: '#ffffff',
            border: '2px solid #ffffff',
        }
        : {
            flex: 1,
            padding: '10px 4px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            color: '#3a1530',
            border: '1px solid #cbbbc6',
        };

    const shiftButtonStyle = isHighContrast
        ? {
            ...virtualKeyStyle,
            fontSize: '16px',
            backgroundColor: isUpperCase ? '#ffb3df' : '#1e003a',
            color: isUpperCase ? '#120024' : '#ffffff',
            border: '2px solid #ffffff',
        }
        : {
            ...virtualKeyStyle,
            fontSize: '16px',
            backgroundColor: isUpperCase ? '#572649' : '#ffffff',
            color: isUpperCase ? '#ffffff' : '#3a1530',
            border: isUpperCase ? '2px solid #3a1530' : '1px solid #cbbbc6',
        };

    const keyboardRows = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '@'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '_', '-'],
    ];

    const getActiveFieldLabel = () => {
        if (activeField === 'email') return 'Email';
        if (activeField === 'password') return 'Password';
        if (activeField === 'confirmPassword') return 'Confirm Password';
        return '';
    };

    return (
        <div
            className="pg-modal-backdrop pg-rewards-auth-backdrop"
            onMouseDown={event => {
                if (event.target === event.currentTarget && !submitting) handleCloseModal();
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
                    onClick={handleCloseModal}
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
                            setConfirmPassword('');
                            setShowConfirmPassword(false);
                            if (activeField === 'confirmPassword') setActiveField(null);
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
                            setConfirmPassword('');
                            setShowConfirmPassword(false);
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
                            inputMode="email"
                            autoComplete="email"
                            required
                            aria-required="true"
                            aria-invalid={Boolean(error && !email.trim())}
                            aria-describedby={error ? 'pg-rewards-auth-error' : undefined}
                            placeholder="you@gmail.com"
                            value={email}
                            disabled={submitting}
                            onFocus={() => setActiveField('email')}
                            onChange={e => setEmail(e.target.value)}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div className="pg-rewards-field">
                        <label htmlFor="pg-rewards-password">Password</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                id="pg-rewards-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                required
                                aria-required="true"
                                aria-invalid={Boolean(error && !password)}
                                aria-describedby={error ? 'pg-rewards-auth-error' : undefined}
                                placeholder="Enter password"
                                value={password}
                                disabled={submitting}
                                onFocus={() => setActiveField('password')}
                                onChange={e => setPassword(e.target.value)}
                                style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}
                            />
                            <button
                                type="button"
                                aria-pressed={showPassword}
                                aria-controls="pg-rewards-password"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                disabled={submitting}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => setShowPassword(prev => !prev)}
                                style={togglePasswordButtonStyle}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    {mode === 'signup' && (
                        <div className="pg-rewards-field">
                            <label htmlFor="pg-rewards-confirm-password">Confirm Password</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    id="pg-rewards-confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    aria-required="true"
                                    aria-invalid={Boolean(
                                        passwordsMismatch ||
                                        (error && (!confirmPassword || password !== confirmPassword))
                                    )}
                                    aria-describedby={
                                        [
                                            passwordsMismatch ? 'pg-rewards-confirm-hint' : '',
                                            error ? 'pg-rewards-auth-error' : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' ') || undefined
                                    }
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    disabled={submitting}
                                    onFocus={() => setActiveField('confirmPassword')}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}
                                />
                                <button
                                    type="button"
                                    aria-pressed={showConfirmPassword}
                                    aria-controls="pg-rewards-confirm-password"
                                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                    disabled={submitting}
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => setShowConfirmPassword(prev => !prev)}
                                    style={togglePasswordButtonStyle}
                                >
                                    {showConfirmPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {passwordsMismatch && (
                                <p
                                    id="pg-rewards-confirm-hint"
                                    role="status"
                                    aria-live="polite"
                                    style={{
                                        margin: '6px 0 0',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        color: isHighContrast ? '#ffb3df' : '#7a0924',
                                    }}
                                >
                                    Passwords do not match yet.
                                </p>
                            )}
                        </div>
                    )}

                    {activeField && !submitting && (
                        <div
                            className="pg-popup-keyboard"
                            role="group"
                            aria-label="On-screen touch keyboard"
                            style={{
                                marginTop: '12px',
                                marginBottom: '12px',
                                padding: '12px',
                                backgroundColor: isHighContrast ? '#120024' : '#f4eef2',
                                border: isHighContrast ? '2px solid #ffffff' : '1px solid #cbbbc6',
                                borderRadius: '10px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '8px',
                                }}
                            >
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                    Typing into: {getActiveFieldLabel()}
                                </span>
                                <button
                                    type="button"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => setActiveField(null)}
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        borderRadius: '6px',
                                    }}
                                >
                                    Hide Keyboard ▼
                                </button>
                            </div>

                            {keyboardRows.map((row, rowIndex) => (
                                <div
                                    key={rowIndex}
                                    style={{
                                        display: 'flex',
                                        gap: '4px',
                                        marginBottom: '6px',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {row.map(keyChar => {
                                        const displayChar = isUpperCase ? keyChar.toUpperCase() : keyChar;
                                        return (
                                            <button
                                                key={keyChar}
                                                type="button"
                                                onMouseDown={e => e.preventDefault()}
                                                onClick={() => handleVirtualKeyPress(keyChar)}
                                                style={virtualKeyStyle}
                                            >
                                                {displayChar}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                <button
                                    type="button"
                                    aria-pressed={isUpperCase}
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => setIsUpperCase(prev => !prev)}
                                    style={shiftButtonStyle}
                                >
                                    {isUpperCase ? '⇧ CAPS ON' : '⇧ Caps'}
                                </button>
                                {activeField === 'email' && (
                                    <button
                                        type="button"
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={() => {
                                            if (activeField === 'email') {
                                                setEmail(prev => prev + '@gmail.com');
                                            }
                                        }}
                                        style={{ ...virtualKeyStyle, fontSize: '16px' }}
                                    >
                                        @gmail.com
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={handleVirtualBackspace}
                                    style={{ ...virtualKeyStyle, fontSize: '16px' }}
                                >
                                    ⌫ Backspace
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div
                            id="pg-rewards-auth-error"
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
                                onClick={handleCloseModal}
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
