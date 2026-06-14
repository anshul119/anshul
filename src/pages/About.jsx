import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function About() {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAboutData() {
      try {
        const docRef = doc(db, 'site_settings', 'about');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAboutData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching about page data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAboutData();
  }, []);

  if (loading) {
    return (
      <div className="flex-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // Fallback defaults
  const bio = aboutData?.bio || "Anshul Sharma is a photographer, and software engineer based in Luxembourg City.";
  const email = aboutData?.contactEmail || "";
  const instagram = aboutData?.instagram || "";
  const twitter = aboutData?.twitter || "";

  return (
    <main className="container about-container fade-in">
      <header style={{ marginBottom: 'var(--spacing-md)' }}>
        <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)' }}>About</h1>
      </header>

      <div className="about-text">
        {bio}
      </div>

      <section className="about-contact">
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-sm)' }}>
          Contact & Representation
        </h3>
        <p style={{ marginBottom: 'var(--spacing-xs)' }}>
          Email: <a href={`mailto:${email}`} style={{ textDecoration: 'underline' }}>{email}</a>
        </p>
        {(instagram || twitter) && (
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
            {instagram && (
              <a
                href={`https://instagram.com/${instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono"
                style={{ fontSize: '0.8rem', textDecoration: 'underline' }}
              >
                Instagram
              </a>
            )}
            {twitter && (
              <a
                href={`https://twitter.com/${twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono"
                style={{ fontSize: '0.8rem', textDecoration: 'underline' }}
              >
                Twitter
              </a>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
