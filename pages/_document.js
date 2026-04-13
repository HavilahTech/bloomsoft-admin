import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon - Consistent with the main site */}
        <link rel="icon" href="/logo.png" />
        
        {/* Admin Specific Metadata */}
        <title>Blooms Admin | Management Portal</title>
        <meta 
          name="description" 
          content="Internal management system for Blooms Soft Furnishing. Manage products, collections, and interior design orders." 
        />
        
        <meta name="robots" content="noindex, nofollow" />
        <meta name="author" content="Blooms Soft Furnishing" />
        <meta charSet="utf-8" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}