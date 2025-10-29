'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>500 - Server Error</h1>
          <p>Something went wrong on our end. Please try again.</p>
          <button 
            onClick={reset}
            style={{ 
              padding: '10px 20px', 
              margin: '10px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
          <br />
          <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}