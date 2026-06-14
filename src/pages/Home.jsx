import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Home() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const q = query(collection(db, 'homepage_photos'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedPhotos = [];
        querySnapshot.forEach((doc) => {
          fetchedPhotos.push({ id: doc.id, ...doc.data() });
        });
        setPhotos(fetchedPhotos);
      } catch (error) {
        console.error("Error fetching homepage photos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPhotos();
  }, []);

  // Handle escape key to close lightbox
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setActivePhoto(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <main className="container fade-in" style={{ marginTop: 'var(--spacing-md)' }}>
      {photos.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--spacing-xl) 0', 
          fontFamily: 'var(--font-serif)',
          fontSize: '1.2rem',
          color: 'var(--text-muted)'
        }}>
          No images uploaded to the homepage grid yet.
        </div>
      ) : (
        <div className="masonry-container">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className="masonry-item"
              onClick={() => setActivePhoto(photo)}
            >
              <img 
                src={photo.imageUrl} 
                alt={photo.caption || "Homepage photography"} 
                className="masonry-image"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="lightbox" onClick={() => setActivePhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={activePhoto.imageUrl} 
              alt={activePhoto.caption || "Fullscreen preview"} 
              className="lightbox-image" 
            />
            {activePhoto.caption && (
              <p className="lightbox-caption">{activePhoto.caption}</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
