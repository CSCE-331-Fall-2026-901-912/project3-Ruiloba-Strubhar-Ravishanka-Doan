import React, { useEffect, useState, useRef } from 'react';

const GoogleTranslateAPI = ({ isHighContrast = false }) => {
    const [languages, setLanguages] = useState([{ code: 'en', label: 'English' }]);
    const [selectedCode, setSelectedCode] = useState('en');
    const [selectedLabel, setSelectedLabel] = useState('English');
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedCode, setFocusedCode] = useState(null);
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const syncLanguages = () => {
            const select = document.querySelector('.goog-te-combo');
            if (select && select.options && select.options.length > 1) {
                const opts = Array.from(select.options)
                    .filter((opt) => opt.value && opt.value !== 'en')
                    .map((opt) => ({
                        code: opt.value,
                        label: opt.text,
                    }));

                if (opts.length > 0) {
                    setLanguages([{ code: 'en', label: 'English' }, ...opts]);
                    return true;
                }
            }
            return false;
        };

        window.googleTranslateElementInit = () => {
            try {
                if (window.google && window.google.translate) {
                    new window.google.translate.TranslateElement(
                        { pageLanguage: 'en', autoDisplay: false },
                        'google_translate_element'
                    );
                    syncLanguages();
                }
            } catch (err) {
                console.error('Google Translate failed to initialize:', err);
            }
        };

        const scriptId = 'google-translate-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            const subdomain = 'translate.';
            script.src = `https://${subdomain}google.com/translate_a/element.js?cb=googleTranslateElementInit`;
            script.async = true;
            document.body.appendChild(script);
        } else if (window.google && window.google.translate) {
            window.googleTranslateElementInit();
        }

        const observer = new MutationObserver(() => {
            if (syncLanguages()) {
                observer.disconnect();
            }
        });

        const target = document.getElementById('google_translate_element') || document.body;
        observer.observe(target, { childList: true, subtree: true });

        const interval = setInterval(() => {
            if (syncLanguages()) {
                clearInterval(interval);
                observer.disconnect();
            }
        }, 250);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    // Re-trigger Google Translate when new React pages, buttons, or API items render
    useEffect(() => {
        if (selectedCode === 'en') return;

        let debounceTimer = null;

        const retranslateObserver = new MutationObserver((mutations) => {
            // Ignore mutations caused by Google Translate's own <font> tags to prevent loops
            const hasAppChange = mutations.some(
                (m) =>
                    !m.target.closest?.('.goog-te-banner-frame, #google_translate_element, .skiptranslate') &&
                    m.target.nodeName !== 'FONT'
            );
            if (!hasAppChange) return;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const select = document.querySelector('.goog-te-combo');
                if (select) {
                    // Briefly reset and re-dispatch change so Google re-scans updated React text nodes
                    select.value = '';
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    setTimeout(() => {
                        select.value = selectedCode;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                    }, 50);
                }
            }, 300);
        });

        retranslateObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => {
            clearTimeout(debounceTimer);
            retranslateObserver.disconnect();
        };
    }, [selectedCode]);

    // Auto-focus search input when dropdown opens so user can start typing immediately
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setTimeout(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 10);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const triggerGoogleTranslate = (code) => {
        const select = document.querySelector('.goog-te-combo');
        if (!select) return;

        if (code === 'en') {
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            select.value = 'en';
            select.dispatchEvent(new Event('change', { bubbles: true }));

            const iframe = document.querySelector('iframe.goog-te-banner-frame, iframe.VIpgJd-ZVi9od-ORHb-OEVmcd');
            const restoreBtn = iframe?.contentDocument?.querySelector('button[id*="restore"]');
            if (restoreBtn) {
                restoreBtn.click();
            }
            return;
        }

        document.cookie = `googtrans=/en/${code}; path=/;`;
        select.value = code;
        select.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(() => {
            select.value = code;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }, 350);
    };

    const handleSelect = (lang) => {
        setSelectedCode(lang.code);
        setSelectedLabel(lang.label);
        setIsOpen(false);
        setSearchQuery('');
        triggerGoogleTranslate(lang.code);
    };

    const handleContainerBlur = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
            setIsOpen(false);
        }
    };

    const filteredLanguages = languages.filter((lang) =>
        lang.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    return (
        <div
            ref={containerRef}
            onBlur={handleContainerBlur}
            className="notranslate"
            style={{ position: 'relative', display: 'inline-block' }}
        >
            <div
                id="google_translate_element"
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    top: '-9999px',
                    left: '-9999px',
                    width: '200px',
                    height: '40px',
                }}
            />

            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Choose a language, current language ${selectedLabel}`}
                onClick={() => setIsOpen((prev) => !prev)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setIsOpen(false);
                    } else if (!isOpen && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        setIsOpen(true);
                        setTimeout(() => setSearchQuery(e.key), 15);
                    }
                }}
                style={
                    isHighContrast
                        ? {
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: '14px',
                            fontWeight: '900',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '3px solid #ffffff',
                            backgroundColor: '#1e003a',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            minWidth: '150px',
                        }
                        : {
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: '13px',
                            fontWeight: '600',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            backgroundColor: '#ffffff',
                            color: '#24211f',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            minWidth: '150px',
                        }
                }
            >
                <span>{selectedLabel}</span>
                <span aria-hidden="true" style={{ fontSize: '10px', color: isHighContrast ? '#ffb3df' : 'inherit' }}>
                    {isOpen ? '▲' : '▼'}
                </span>
            </button>

            {isOpen && (
                <div
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsOpen(false);
                    }}
                    style={
                        isHighContrast
                            ? {
                                position: 'absolute',
                                top: 'calc(100% + 6px)',
                                right: 0,
                                zIndex: 10050,
                                padding: '8px',
                                width: '230px',
                                backgroundColor: '#120024',
                                border: '4px solid #ffffff',
                                borderRadius: '6px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85)',
                            }
                            : {
                                position: 'absolute',
                                top: 'calc(100% + 6px)',
                                right: 0,
                                zIndex: 10050,
                                padding: '6px',
                                width: '220px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #d7d2c7',
                                borderRadius: '8px',
                                boxShadow: '0 8px 24px rgba(36, 33, 31, 0.18)',
                            }
                    }
                >
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Type a language..."
                        aria-label="Search languages"
                        style={
                            isHighContrast
                                ? {
                                    width: '100%',
                                    padding: '7px 10px',
                                    marginBottom: '6px',
                                    borderRadius: '4px',
                                    border: '3px solid #ffb3df',
                                    backgroundColor: '#1e003a',
                                    color: '#ffffff',
                                    fontFamily: '"DM Sans", sans-serif',
                                    fontSize: '13px',
                                    fontWeight: '800',
                                    outline: 'none',
                                }
                                : {
                                    width: '100%',
                                    padding: '6px 10px',
                                    marginBottom: '6px',
                                    borderRadius: '5px',
                                    border: '1px solid #d7d2c7',
                                    backgroundColor: '#f8f6f1',
                                    color: '#24211f',
                                    fontFamily: '"DM Sans", sans-serif',
                                    fontSize: '13px',
                                    outline: 'none',
                                }
                        }
                    />

                    <ul
                        role="listbox"
                        aria-label="Available languages"
                        style={{
                            margin: 0,
                            padding: 0,
                            listStyle: 'none',
                            maxHeight: '220px',
                            overflowY: 'auto',
                        }}
                    >
                        {filteredLanguages.length === 0 ? (
                            <li
                                style={{
                                    padding: '8px 10px',
                                    fontSize: '12px',
                                    color: isHighContrast ? '#ffb3df' : '#89847f',
                                    fontWeight: isHighContrast ? '800' : '500',
                                }}
                            >
                                No matching languages
                            </li>
                        ) : (
                            filteredLanguages.map((lang) => {
                                const isSelected = lang.code === selectedCode;
                                const isFocused = focusedCode === lang.code;

                                return (
                                    <li key={lang.code} role="option" aria-selected={isSelected}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(lang)}
                                            onFocus={() => setFocusedCode(lang.code)}
                                            onBlur={() => setFocusedCode(null)}
                                            onMouseEnter={() => setFocusedCode(lang.code)}
                                            onMouseLeave={() => setFocusedCode(null)}
                                            style={
                                                isHighContrast
                                                    ? {
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '8px 10px',
                                                        marginBottom: '4px',
                                                        border: isSelected || isFocused ? '3px solid #ffb3df' : '2px solid #ffffff',
                                                        borderRadius: '4px',
                                                        backgroundColor: isSelected || isFocused ? '#ffffff' : '#1e003a',
                                                        color: isSelected || isFocused ? '#120024' : '#ffffff',
                                                        fontFamily: '"DM Sans", sans-serif',
                                                        fontSize: '14px',
                                                        fontWeight: '900',
                                                        cursor: 'pointer',
                                                    }
                                                    : {
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '8px 10px',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        backgroundColor: isFocused
                                                            ? '#572649'
                                                            : isSelected
                                                                ? '#f3eafb'
                                                                : 'transparent',
                                                        color: isFocused ? '#ffffff' : '#24211f',
                                                        fontFamily: '"DM Sans", sans-serif',
                                                        fontSize: '13px',
                                                        fontWeight: isSelected || isFocused ? '700' : '500',
                                                        cursor: 'pointer',
                                                    }
                                            }
                                        >
                                            {lang.label}
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default GoogleTranslateAPI;
