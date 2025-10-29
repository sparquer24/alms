// Custom document to ensure proper HTML structure
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Arms License Management System" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
