import type { AppProps } from 'next/app';
import '../lib/scenarist'; // Initialize Scenarist

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
