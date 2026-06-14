import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Blog() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const q = query(
          collection(db, 'articles'),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetched = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'published') {
            fetched.push({ id: doc.id, ...data });
          }
        });
        setArticles(fetched);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  function formatDate(dateString) {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }

  if (loading) {
    return (
      <div className="flex-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <main className="container fade-in">
      <header className="blog-header">
        <h1 style={{ fontSize: '3rem', marginBottom: 'var(--spacing-xs)' }}>Stories</h1>
      </header>

      {articles.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-xl) 0',
          fontFamily: 'var(--font-serif)',
          fontSize: '1.2rem',
          color: 'var(--text-muted)'
        }}>
          No articles published yet. Check back soon.
        </div>
      ) : (
        <div className="blog-grid">
          {articles.map((article) => (
            <article key={article.id} className="blog-card">
              {article.coverImageUrl && (
                <Link to={`/blog/${article.id}`} className="blog-card-thumbnail-wrapper">
                  <img
                    src={article.coverImageUrl}
                    alt={article.title}
                    className="blog-card-thumbnail"
                    loading="lazy"
                  />
                </Link>
              )}

              <div className="blog-card-meta">
                <span className="mono">{article.tag || "Stories"}</span>
                <span className="mono" style={{ fontSize: '0.75rem' }}>{formatDate(article.date)}</span>
              </div>

              <Link to={`/blog/${article.id}`}>
                <h2 className="blog-card-title">{article.title}</h2>
              </Link>

              {article.excerpt && (
                <p className="blog-card-excerpt">{article.excerpt}</p>
              )}

              <Link to={`/blog/${article.id}`} className="read-more mono">
                Read Entry
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
