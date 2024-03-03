import "../styles.css";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta
          name="google-site-verification"
          content="ly6FGyn_FKEZHihe55ClBlOQtQIB4UyFzrNFshsEC70"
        />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
