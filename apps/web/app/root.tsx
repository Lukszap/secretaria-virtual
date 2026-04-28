import type { LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import styles from "./styles/global.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&family=Source+Sans+3:wght@400;500;600&display=swap",
  },
  { rel: "stylesheet", href: styles },
];

export default function App() {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="font-sans antialiased bg-gradient-mesh min-h-screen">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
