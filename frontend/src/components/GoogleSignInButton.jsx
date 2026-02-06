import { useEffect, useRef } from 'react';

function GoogleSignInButton({ clientId, onSuccess, onError }) {
  const buttonRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!clientId || initializedRef.current) return;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;
      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError?.('Google sign-in failed');
          }
        },
      });

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
        });
      }
    };

    // Load the Google Identity Services script
    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    }
  }, [clientId, onSuccess, onError]);

  if (!clientId) return null;

  return (
    <div>
      <div ref={buttonRef} style={{ display: 'flex', justifyContent: 'center' }} />
    </div>
  );
}

export default GoogleSignInButton;
