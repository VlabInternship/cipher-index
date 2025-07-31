import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Ciphers Landing Page</title>
        <meta name="description" content="List of stream ciphers" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}
      >
        <main style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "2rem", color: "#0e7490" }}>Ciphers Playground</h1>
          <p style={{ fontSize: "1.2rem", marginBottom: "2rem", color: "#334155" }}>Select a cipher to explore its interactive visualization:</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "1.5rem" }}>
              <a
                href="/salsa20"
                style={{
                  display: "inline-block",
                  padding: "1rem 2.5rem",
                  fontSize: "1.25rem",
                  fontWeight: "500",
                  color: "#fff",
                  background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                  borderRadius: "0.75rem",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                  transition: "background 0.2s, transform 0.2s",
                }}
                onMouseOver={e => e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)"}
                onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)"}
              >
                SalSa20 Cipher
              </a>
            </li>
            {/* Add more ciphers here as you create their pages */}
          </ul>
        </main>
        <footer style={{ marginTop: "3rem", color: "#64748b", fontSize: "0.95rem" }}>
          &copy; {new Date().getFullYear()} Ciphers Playground
        </footer>
      </div>
    </>
  );
}
