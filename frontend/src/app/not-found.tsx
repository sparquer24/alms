export default function NotFound() {
  return (
    <html>
      <body>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
          <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
            Go back home
          </a>
        </div>
      </body>
    </html>
  );
}