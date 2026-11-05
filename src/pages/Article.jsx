import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import renderArticleText from '../components/renderArticleText';

export default function Article() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const docRef = doc(db, 'articles', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setArticle(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id]);

  function formatDate(dateString) {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }

  // Legacy blocks combine paragraph breaks with inline HTML formatting.
  function renderParagraphs(text) {
    if (!text) return null;
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index}>{renderArticleText(paragraph)}</p>
    ));
  }

  if (loading) {
    return (
      <div className="flex-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <main className="container fade-in" style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
        <h1 style={{ marginBottom: 'var(--spacing-md)' }}>Article Not Found</h1>
        <Link to="/blog" className="mono" style={{ textDecoration: 'underline' }}>Back to Stories</Link>
      </main>
    );
  }

  return (
    <main className="article-container fade-in">
      {/* Draft banner for administrator visibility */}
      {article.status === 'draft' && (
        <div style={{
          backgroundColor: '#fafafa',
          border: '1px dashed var(--border-color)',
          padding: 'var(--spacing-sm)',
          textAlign: 'center',
          marginBottom: 'var(--spacing-md)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem'
        }}>
          DRAFT PREVIEW
        </div>
      )}

      <header className="article-header">
        <div className="article-meta">
          <span className="mono">{article.tag || "Stories"}</span>
          <span className="mono">&bull;</span>
          <span className="mono">{formatDate(article.date)}</span>
        </div>
        <h1 className="article-title">{article.title}</h1>
      </header>

      {/* Render Content */}
      <div className="article-body">
        {article.content ? (
          <div dangerouslySetInnerHTML={{ __html: article.content }} className="article-content html-content" />
        ) : (
          <div className="article-blocks">
            {article.blocks && article.blocks.map((block, index) => {
              switch (block.type) {
                case 'text':
                  return (
                    <div key={index} className="block-text html-content">
                      {renderParagraphs(block.value)}
                    </div>
                  );

                case 'single_photo':
                  return (
                    <figure key={index} className="block-single-photo">
                      <img src={block.url} alt={block.caption || "Article photography"} loading="lazy" />
                      {block.caption && (
                        <figcaption className="block-photo-caption">{block.caption}</figcaption>
                      )}
                    </figure>
                  );

                case 'photo_grid':
                  const colsCount = block.images ? block.images.length : 2;
                  return (
                    <div key={index} className={`block-photo-grid cols-${colsCount}`}>
                      {block.images && block.images.map((imgUrl, imgIdx) => (
                        <div key={imgIdx} className="block-photo-grid-item">
                          <img src={imgUrl} alt={`Grid item ${imgIdx + 1}`} loading="lazy" />
                        </div>
                      ))}
                    </div>
                  );

                case 'link':
                  return (
                    <div key={index} className="block-link">
                      <a
                        href={block.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block-link-button"
                      >
                        {block.text || "Visit Link"}
                      </a>
                    </div>
                  );

                case 'embed':
                  return (
                    <div
                      key={index}
                      className="block-embed"
                      dangerouslySetInnerHTML={{ __html: block.code }}
                    />
                  );

                default:
                  return null;
              }
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 'var(--spacing-xl)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)' }}>
        <Link to="/blog" className="mono" style={{ textDecoration: 'underline' }}>
          &larr; Back to Stories
        </Link>
      </div>
    </main>
  );
}
