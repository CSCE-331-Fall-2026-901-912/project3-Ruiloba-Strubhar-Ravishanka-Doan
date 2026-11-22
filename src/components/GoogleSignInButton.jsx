import React, { useEffect, useRef } from 'react';

const scriptUrl = 'https://accounts.google.com/gsi/client';

export default function GoogleSignInButton({ clientId, onCredential, onError }) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return undefined;
    let active = true;

    const renderButton = () => {
      if (!active || !window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: response => {
          if (response.credential) onCredentialRef.current(response.credential);
          else onErrorRef.current('Google did not return a sign-in credential.');
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        width: 240,
      });
    };
    const handleScriptError = () => {
      if (active) onErrorRef.current('Google sign-in could not be loaded.');
    };

    let script = document.querySelector(`script[src="${scriptUrl}"]`);
    if (window.google?.accounts?.id) {
      renderButton();
    } else if (script) {
      script.addEventListener('load', renderButton, { once: true });
      script.addEventListener('error', handleScriptError, { once: true });
    } else {
      script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderButton, { once: true });
      script.addEventListener('error', handleScriptError, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      active = false;
    };
  }, [clientId]);

  if (!clientId) {
    return <p className="pg-account-note">Google sign-in is not configured. Guest checkout is still available.</p>;
  }
  return <div className="pg-google-signin" ref={buttonRef} aria-label="Sign in with Google" />;
}
