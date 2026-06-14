import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  auth, db, storage
} from '../firebase';
import {
  Image as ImageIcon, FileText, User, Plus, Trash2, Edit3, LogOut,
  ArrowUp, ArrowDown, Upload, Link2, Code, Grid, Save, X, Eye
} from 'lucide-react';
import WYSIWYGEditor from '../components/WYSIWYGEditor';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'articles' | 'about'

  // Articles state
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articleView, setArticleView] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingArticleId, setEditingArticleId] = useState(null);

  // Article form state
  const [articleTitle, setArticleTitle] = useState('');
  const [articleTag, setArticleTag] = useState('');
  const [articleDate, setArticleDate] = useState('');
  const [articleExcerpt, setArticleExcerpt] = useState('');
  const [articleCoverUrl, setArticleCoverUrl] = useState('');
  const [articleStatus, setArticleStatus] = useState('draft'); // 'draft' | 'published'
  const [articleContent, setArticleContent] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

  // About state
  const [aboutBio, setAboutBio] = useState('');
  const [aboutEmail, setAboutEmail] = useState('');
  const [aboutInstagram, setAboutInstagram] = useState('');
  const [aboutTwitter, setAboutTwitter] = useState('');
  const [aboutLoading, setAboutLoading] = useState(false);
  const [aboutSaving, setAboutSaving] = useState(false);

  // Global file upload helper
  async function uploadFile(file, folder = 'uploads') {
    const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  }

  // Convert legacy blocks array to HTML content for editor
  function convertBlocksToHtml(blocks) {
    if (!blocks || !Array.isArray(blocks)) return '<p><br></p>';
    return blocks.map(block => {
      switch (block.type) {
        case 'text':
          if (!block.value) return '';
          return block.value.split('\n\n').map(p => {
            const clean = p.trim().replace(/\n/g, '<br>');
            return clean ? `<p>${clean}</p>` : '';
          }).join('');
        case 'single_photo':
          return `<p><img src="${block.url}" alt="${block.caption || ''}" style="max-width: 100%; height: auto; display: block; margin: 2rem auto;" /></p>`;
        case 'photo_grid':
          if (!block.images || !Array.isArray(block.images)) return '';
          return block.images.map(imgUrl => `<p><img src="${imgUrl}" alt="" style="max-width: 100%; height: auto; display: block; margin: 2rem auto;" /></p>`).join('');
        case 'link':
          return `<p><a href="${block.url}" target="_blank" rel="noopener noreferrer">${block.text || block.url}</a></p>`;
        case 'embed':
          return `<div class="block-embed" style="margin: 2rem 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"><div style="position: absolute; top:0; left:0; width:100%; height:100%;">${block.code}</div></div>`;
        default:
          return '';
      }
    }).join('');
  }

  // Handle Logout
  async function handleLogout() {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  // ----------------------------------------------------
  // HOMEPAGE PHOTOS GRID CONTROLLER
  // ----------------------------------------------------
  async function fetchPhotos() {
    setPhotosLoading(true);
    try {
      const q = query(collection(db, 'homepage_photos'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const fetched = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      setPhotos(fetched);
    } catch (err) {
      console.error("Error loading photos:", err);
    } finally {
      setPhotosLoading(false);
    }
  }

  async function handleAddPhoto(e) {
    e.preventDefault();
    if (!newPhotoFile) return;

    setPhotoUploading(true);
    try {
      const imageUrl = await uploadFile(newPhotoFile, 'homepage_photos');
      const order = photos.length > 0 ? Math.max(...photos.map(p => p.order || 0)) + 1 : 1;

      const newDoc = {
        imageUrl,
        caption: newPhotoCaption,
        order,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'homepage_photos'), newDoc);
      setNewPhotoFile(null);
      setNewPhotoCaption('');
      // Reset input element
      const fileInput = document.getElementById('photo-file-input');
      if (fileInput) fileInput.value = '';

      await fetchPhotos();
    } catch (err) {
      console.error("Error adding photo:", err);
      alert("Failed to upload photo.");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleDeletePhoto(id, imageUrl) {
    if (!window.confirm("Are you sure you want to delete this photo from the homepage?")) return;

    try {
      // 1. Delete Firestore reference
      await deleteDoc(doc(db, 'homepage_photos', id));

      // 2. Delete Storage file
      try {
        const fileRef = ref(storage, imageUrl);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn("Storage deletion error (image might already be gone):", err);
      }

      await fetchPhotos();
    } catch (err) {
      console.error("Error deleting photo:", err);
      alert("Failed to delete photo.");
    }
  }

  async function handleUpdatePhotoCaption(id, newCaption) {
    try {
      await updateDoc(doc(db, 'homepage_photos', id), { caption: newCaption });
      setPhotos(photos.map(p => p.id === id ? { ...p, caption: newCaption } : p));
    } catch (err) {
      console.error("Error updating caption:", err);
    }
  }

  async function handleUpdatePhotoOrder(id, newOrder) {
    const orderInt = parseInt(newOrder, 10) || 0;
    try {
      await updateDoc(doc(db, 'homepage_photos', id), { order: orderInt });
      setPhotos(photos.map(p => p.id === id ? { ...p, order: orderInt } : p));
    } catch (err) {
      console.error("Error updating order:", err);
    }
  }

  // ----------------------------------------------------
  // ARTICLES CONTROLLER
  // ----------------------------------------------------
  async function fetchArticles() {
    setArticlesLoading(true);
    try {
      const q = query(collection(db, 'articles'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const fetched = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      setArticles(fetched);
    } catch (err) {
      console.error("Error loading articles:", err);
    } finally {
      setArticlesLoading(false);
    }
  }

  function handleOpenCreateArticle() {
    setArticleTitle('');
    setArticleTag('');
    setArticleDate(new Date().toISOString().split('T')[0]);
    setArticleExcerpt('');
    setArticleCoverUrl('');
    setArticleStatus('draft');
    setArticleContent('<p><br></p>');
    setArticleView('create');
  }

  async function handleOpenEditArticle(article) {
    setEditingArticleId(article.id);
    setArticleTitle(article.title || '');
    setArticleTag(article.tag || '');
    setArticleDate(article.date || '');
    setArticleExcerpt(article.excerpt || '');
    setArticleCoverUrl(article.coverImageUrl || '');
    setArticleStatus(article.status || 'draft');

    // Load content dynamically: HTML content, block conversion, or empty default
    if (article.content) {
      setArticleContent(article.content);
    } else if (article.blocks && article.blocks.length > 0) {
      setArticleContent(convertBlocksToHtml(article.blocks));
    } else {
      setArticleContent('<p><br></p>');
    }

    setArticleView('edit');
  }

  async function handleSaveArticle(e) {
    e.preventDefault();
    if (!articleTitle) return;

    setFormSubmitting(true);
    try {
      const payload = {
        title: articleTitle,
        tag: articleTag,
        date: articleDate,
        excerpt: articleExcerpt,
        coverImageUrl: articleCoverUrl,
        status: articleStatus,
        content: articleContent,
        updatedAt: new Date().toISOString()
      };

      if (articleView === 'create') {
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'articles'), payload);
      } else {
        await updateDoc(doc(db, 'articles', editingArticleId), payload);
      }

      setArticleView('list');
      await fetchArticles();
    } catch (err) {
      console.error("Error saving article:", err);
      alert("Failed to save article.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDeleteArticle(id) {
    if (!window.confirm("Are you sure you want to delete this article? This cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, 'articles', id));
      await fetchArticles();
    } catch (err) {
      console.error("Error deleting article:", err);
      alert("Failed to delete article.");
    }
  }

  // File upload for Cover Image
  async function handleCoverImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setFormSubmitting(true);
      const url = await uploadFile(file, 'article_covers');
      setArticleCoverUrl(url);
    } catch (err) {
      console.error("Cover upload error:", err);
      alert("Cover image upload failed.");
    } finally {
      setFormSubmitting(false);
    }
  }

  // Helper to upload images from WYSIWYG editor
  async function handleEditorImageUpload(file) {
    return await uploadFile(file, 'article_images');
  }

  // ----------------------------------------------------
  // ABOUT PAGE CONTROLLER
  // ----------------------------------------------------
  async function fetchAboutData() {
    setAboutLoading(true);
    try {
      const docRef = doc(db, 'site_settings', 'about');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAboutBio(data.bio || '');
        setAboutEmail(data.contactEmail || '');
        setAboutInstagram(data.instagram || '');
        setAboutTwitter(data.twitter || '');
      }
    } catch (err) {
      console.error("Error fetching about text:", err);
    } finally {
      setAboutLoading(false);
    }
  }

  async function handleSaveAbout(e) {
    e.preventDefault();
    setAboutSaving(true);
    try {
      const payload = {
        bio: aboutBio,
        contactEmail: aboutEmail,
        instagram: aboutInstagram,
        twitter: aboutTwitter,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'site_settings', 'about'), payload);
      alert("About settings updated successfully.");
    } catch (err) {
      console.error("Error saving about page settings:", err);
      alert("Failed to save about details.");
    } finally {
      setAboutSaving(false);
    }
  }

  // ----------------------------------------------------
  // LIFE CYCLES / TRIGGERS
  // ----------------------------------------------------
  useEffect(() => {
    if (activeTab === 'photos') fetchPhotos();
    else if (activeTab === 'articles') fetchArticles();
    else if (activeTab === 'about') fetchAboutData();
  }, [activeTab]);

  return (
    <div className="container" style={{ marginTop: 'var(--spacing-md)' }}>
      <div className="admin-layout">

        {/* Sidebar Navigation */}
        <aside className="admin-sidebar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>Control Panel</h3>
            <span className="mono" style={{ fontSize: '0.65rem' }}>Anshul Sharma</span>
          </div>

          <nav>
            <ul className="admin-sidebar-nav">
              <li>
                <button
                  className={`admin-sidebar-link ${activeTab === 'photos' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('photos'); setArticleView('list'); }}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <Grid size={16} /> Homepage Grid
                </button>
              </li>
              <li>
                <button
                  className={`admin-sidebar-link ${activeTab === 'articles' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('articles'); }}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <FileText size={16} /> Stories
                </button>
              </li>
              <li>
                <button
                  className={`admin-sidebar-link ${activeTab === 'about' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('about'); setArticleView('list'); }}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <User size={16} /> About Settings
                </button>
              </li>
            </ul>
          </nav>

          <button
            onClick={handleLogout}
            className="admin-btn secondary"
            style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <LogOut size={14} /> Logout
          </button>
        </aside>

        {/* Dashboard Main View */}
        <main className="admin-main fade-in">

          {/* TAB 1: HOMEPAGE GRID MANAGER */}
          {activeTab === 'photos' && (
            <div>
              <div className="admin-header-row">
                <h2 style={{ fontFamily: 'var(--font-serif)' }}>Homepage Grid</h2>
                <span className="mono" style={{ fontSize: '0.8rem' }}>{photos.length} Images</span>
              </div>

              {/* Upload image form */}
              <form onSubmit={handleAddPhoto} style={{ border: '1px solid var(--border-color)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-sans)', fontWeight: '500', marginBottom: 'var(--spacing-sm)' }}>Upload Image</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                  <div className="form-group">
                    <label className="mono" style={{ fontSize: '0.7rem' }}>Select Photo</label>
                    <input
                      id="photo-file-input"
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setNewPhotoFile(e.target.files[0])}
                    />
                  </div>

                  <div className="form-group">
                    <label className="mono" style={{ fontSize: '0.7rem' }}>Caption (Optional)</label>
                    <input
                      type="text"
                      value={newPhotoCaption}
                      onChange={(e) => setNewPhotoCaption(e.target.value)}
                      placeholder="Caption text"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-btn"
                  disabled={photoUploading}
                  style={{ width: 'auto', padding: 'var(--spacing-xs) var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Upload size={14} /> {photoUploading ? "Uploading..." : "Upload Photo"}
                </button>
              </form>

              {/* List grid photos */}
              {photosLoading ? (
                <div className="flex-center"><div className="spinner"></div></div>
              ) : photos.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No homepage photos found.</p>
              ) : (
                <div className="admin-grid-manager">
                  {photos.map(photo => (
                    <div key={photo.id} className="admin-grid-card">
                      <img src={photo.imageUrl} alt={photo.caption || "Grid item"} />
                      <div className="admin-grid-card-body">
                        <label className="mono" style={{ fontSize: '0.65rem' }}>Caption</label>
                        <textarea
                          className="admin-grid-card-caption"
                          value={photo.caption || ''}
                          onChange={(e) => handleUpdatePhotoCaption(photo.id, e.target.value)}
                          placeholder="Edit caption"
                          rows={2}
                        />

                        <div className="admin-grid-card-actions">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <label className="mono" style={{ fontSize: '0.65rem' }}>Order</label>
                            <input
                              type="number"
                              value={photo.order || 0}
                              onChange={(e) => handleUpdatePhotoOrder(photo.id, e.target.value)}
                              style={{ width: '50px', padding: '2px', fontSize: '0.8rem', textAlign: 'center' }}
                            />
                          </div>

                          <button
                            onClick={() => handleDeletePhoto(photo.id, photo.imageUrl)}
                            className="icon-btn delete"
                            title="Delete Photo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STORIES MANAGER */}
          {activeTab === 'articles' && (
            <div>
              {/* LIST VIEW */}
              {articleView === 'list' && (
                <div>
                  <div className="admin-header-row">
                    <h2 style={{ fontFamily: 'var(--font-serif)' }}>Stories</h2>
                    <button onClick={handleOpenCreateArticle} className="admin-btn" style={{ width: 'auto', margin: 0, padding: 'var(--spacing-xs) var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={14} /> New Post
                    </button>
                  </div>

                  {articlesLoading ? (
                    <div className="flex-center"><div className="spinner"></div></div>
                  ) : articles.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No stories found.</p>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Tag</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {articles.map(article => (
                          <tr key={article.id}>
                            <td style={{ fontWeight: '500' }}>{article.title}</td>
                            <td><span className="mono" style={{ fontSize: '0.7rem' }}>{article.tag}</span></td>
                            <td><span className="mono" style={{ fontSize: '0.7rem' }}>{article.date}</span></td>
                            <td>
                              <span style={{
                                padding: '2px 6px',
                                fontSize: '0.75rem',
                                border: '1px solid',
                                borderColor: article.status === 'published' ? '#cf222e' : '#e5e5e5',
                                color: article.status === 'published' ? '#cf222e' : 'var(--text-muted)'
                              }}>
                                {article.status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div className="admin-actions">
                                <Link2 to={`/blog/${article.id}`} target="_blank" className="icon-btn" title="View Public Post" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  <Eye size={16} />
                                </Link2>
                                <button onClick={() => handleOpenEditArticle(article)} className="icon-btn" title="Edit Post">
                                  <Edit3 size={16} />
                                </button>
                                <button onClick={() => handleDeleteArticle(article.id)} className="icon-btn delete" title="Delete Post">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* CREATE / EDIT FORM VIEW */}
              {(articleView === 'create' || articleView === 'edit') && (
                <div>
                  <div className="admin-header-row" style={{ borderBottom: 'none', marginBottom: '12px' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0 }}>
                      {articleView === 'create' ? "New Story" : "Edit Story"}
                    </h2>
                    <button onClick={() => setArticleView('list')} className="icon-btn" title="Back to list" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveArticle}>

                    {/* Centered Document Sheet */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      padding: '40px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      minHeight: '75vh',
                      position: 'relative'
                    }}>

                      {/* Document Meta Row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px',
                        flexWrap: 'wrap'
                      }}>
                        <input
                          type="text"
                          value={articleTag}
                          onChange={(e) => setArticleTag(e.target.value)}
                          placeholder="TAG (E.G. STORIES)"
                          style={{
                            border: 'none',
                            borderBottom: '1px dashed var(--border-color)',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            textAlign: 'center',
                            width: '180px',
                            padding: '4px',
                            textTransform: 'uppercase',
                            outline: 'none',
                            backgroundColor: 'transparent'
                          }}
                        />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>&bull;</span>
                        <input
                          type="date"
                          value={articleDate}
                          onChange={(e) => setArticleDate(e.target.value)}
                          style={{
                            border: 'none',
                            borderBottom: '1px dashed var(--border-color)',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            textAlign: 'center',
                            width: '140px',
                            padding: '4px',
                            outline: 'none',
                            backgroundColor: 'transparent'
                          }}
                        />
                      </div>

                      {/* Document Title (Huge, Centered H1-style) */}
                      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <input
                          type="text"
                          required
                          value={articleTitle}
                          onChange={(e) => setArticleTitle(e.target.value)}
                          placeholder="Title your story..."
                          style={{
                            fontSize: '2.5rem',
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            width: '100%',
                            maxWidth: '760px',
                            border: 'none',
                            borderBottom: '1px dashed transparent',
                            outline: 'none',
                            padding: '8px',
                            margin: '0 auto',
                            display: 'block',
                            backgroundColor: 'transparent'
                          }}
                          onFocus={(e) => e.target.style.borderBottom = '1px dashed var(--border-color)'}
                          onBlur={(e) => e.target.style.borderBottom = '1px dashed transparent'}
                        />
                      </div>

                      {/* Cover Image Slot */}
                      <div style={{ maxWidth: '760px', margin: '0 auto 24px auto', width: '100%' }}>
                        {articleCoverUrl ? (
                          <div style={{ position: 'relative', width: '100%', maxHeight: '380px', overflow: 'hidden', marginBottom: '12px', border: '1px solid var(--border-color)' }}>
                            <img src={articleCoverUrl} alt="Cover Preview" style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '380px', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => setArticleCoverUrl('')}
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Remove Cover Image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <label style={{
                            border: '1px dashed var(--border-color)',
                            padding: '40px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--hover-bg)',
                            marginBottom: '12px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                            className="cover-upload-area"
                          >
                            <Upload size={20} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click to upload cover thumbnail image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverImageUpload}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <label className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Cover URL:</label>
                          <input
                            type="text"
                            value={articleCoverUrl}
                            onChange={(e) => setArticleCoverUrl(e.target.value)}
                            placeholder="Or paste an image URL..."
                            style={{
                              flexGrow: 1,
                              border: 'none',
                              borderBottom: '1px solid var(--border-color)',
                              fontSize: '0.8rem',
                              padding: '4px',
                              outline: 'none',
                              backgroundColor: 'transparent'
                            }}
                          />
                        </div>
                      </div>

                      {/* Excerpt Block */}
                      <div style={{ maxWidth: '760px', margin: '0 auto 16px auto', width: '100%' }}>
                        <input
                          type="text"
                          value={articleExcerpt}
                          onChange={(e) => setArticleExcerpt(e.target.value)}
                          placeholder="Write a brief subtitle/excerpt..."
                          style={{
                            fontSize: '1rem',
                            fontStyle: 'italic',
                            textAlign: 'center',
                            width: '100%',
                            border: 'none',
                            borderBottom: '1px dashed var(--border-color)',
                            outline: 'none',
                            padding: '8px 4px',
                            color: 'var(--text-muted)',
                            backgroundColor: 'transparent'
                          }}
                        />
                      </div>

                      {/* WYSIWYG Editor */}
                      <div style={{ flexGrow: 1 }}>
                        <WYSIWYGEditor
                          html={articleContent}
                          onChange={(html) => setArticleContent(html)}
                          onImageUpload={handleEditorImageUpload}
                        />
                      </div>

                      {/* Document Actions Footer */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        maxWidth: '760px',
                        margin: '32px auto 0 auto',
                        width: '100%',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '24px',
                        flexWrap: 'wrap',
                        gap: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label className="mono" style={{ fontSize: '0.75rem' }}>Status:</label>
                          <select
                            value={articleStatus}
                            onChange={(e) => setArticleStatus(e.target.value)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              backgroundColor: '#ffffff',
                              outline: 'none',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            <option value="draft">Draft (Private)</option>
                            <option value="published">Published (Public)</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            type="button"
                            className="admin-btn secondary"
                            onClick={() => setArticleView('list')}
                            style={{ margin: 0, padding: '8px 16px', width: 'auto', fontSize: '0.85rem' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="admin-btn"
                            disabled={formSubmitting}
                            style={{ margin: 0, padding: '8px 24px', width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                          >
                            <Save size={14} /> {formSubmitting ? "Saving..." : "Save Entry"}
                          </button>
                        </div>
                      </div>

                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ABOUT PAGE SETTINGS */}
          {activeTab === 'about' && (
            <div>
              <div className="admin-header-row">
                <h2 style={{ fontFamily: 'var(--font-serif)' }}>About Settings</h2>
              </div>

              {aboutLoading ? (
                <div className="flex-center"><div className="spinner"></div></div>
              ) : (
                <form onSubmit={handleSaveAbout} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>

                  <div className="form-group">
                    <label className="mono" style={{ fontSize: '0.75rem' }}>Biography Text</label>
                    <textarea
                      rows={8}
                      value={aboutBio}
                      onChange={(e) => setAboutBio(e.target.value)}
                      placeholder="Write your bio here..."
                      style={{ padding: 'var(--spacing-sm)', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)' }}>
                    <div className="form-group">
                      <label className="mono" style={{ fontSize: '0.75rem' }}>Contact Email</label>
                      <input
                        type="email"
                        value={aboutEmail}
                        onChange={(e) => setAboutEmail(e.target.value)}
                        placeholder="hello@anshul.art"
                      />
                    </div>

                    <div className="form-group">
                      <label className="mono" style={{ fontSize: '0.75rem' }}>Instagram Handle</label>
                      <input
                        type="text"
                        value={aboutInstagram}
                        onChange={(e) => setAboutInstagram(e.target.value)}
                        placeholder="@anshul"
                      />
                    </div>

                    <div className="form-group">
                      <label className="mono" style={{ fontSize: '0.75rem' }}>Twitter Handle</label>
                      <input
                        type="text"
                        value={aboutTwitter}
                        onChange={(e) => setAboutTwitter(e.target.value)}
                        placeholder="@anshul_sharma"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="admin-btn"
                    disabled={aboutSaving}
                    style={{ width: 'auto', padding: 'var(--spacing-xs) var(--spacing-md)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Save size={14} /> {aboutSaving ? "Saving Settings..." : "Save About Settings"}
                  </button>

                </form>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
