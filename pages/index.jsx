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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", padding: "1rem" }}>
            <a
              href="/salsa20-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              SalSa20 Cipher
            </a>
            <a
              href="/hill-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              Hill Cipher
            </a>
            <a
              href="/railfence-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              RailFence Cipher
            </a>
            <a
              href="/vigenere-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              Vigenere Cipher
            </a>
            <a
              href="/a51-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              A5/1 Cipher
            </a>
            <a
              href="/chacha20-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              ChaCha20 Cipher
            </a>
            <a
              href="/onetimepad-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              One Time Pad Cipher
            </a>
            <a
              href="/speck-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              Speck Cipher
            </a>
            <a
              href="/present-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              Present Cipher
            </a>
            <a
              href="/rc4-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              RC4 Cipher
            </a>
            <a
              href="/aes-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              AES Cipher
            </a>
            <a
              href="/des-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              DES Cipher
              </a>
              <a
              href="/feistel-cipher"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                fontSize: "1.25rem",
                fontWeight: "500",
                color: "#fff",
                background: "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                borderRadius: "0.75rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(14,116,144,0.08)",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#38bdf8,#0ea5e9)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "linear-gradient(90deg,#0ea5e9,#38bdf8)")}
            >
              Feistel Cipher
            </a>
          </div>
        </main>
      </div>
    </>
  );
}
