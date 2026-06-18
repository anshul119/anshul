import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  auth, db, storage
} from '../firebase';
import {
  Image as ImageIcon, FileText, User, Plus, Trash2, Edit3, LogOut,
  ArrowUp, ArrowDown, Upload, Link2, Code, Grid, Save, X, Eye, FolderOpen, ArrowLeft, ArrowRight, GripVertical
} from 'lucide-react';
import WYSIWYGEditor from '../components/WYSIWYGEditor';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'articles' | 'about' | 'media'

  // Centralized Media Library State
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);

  // Media Picker Dialog State
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedPickerId, setSelectedPickerId] = useState(null);
  const [mediaPickerResolve, setMediaPickerResolve] = useState(null);
  const [mediaPickerReject, setMediaPickerReject] = useState(null);

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
  const [draggedIndex, setDraggedIndex] = useState(null);

  // About state
  const [aboutBio, setAboutBio] = useState('');
  const [aboutEmail, setAboutEmail] = useState('');
  const [aboutInstagram, setAboutInstagram] = useState('');
  const [aboutTwitter, setAboutTwitter] = useState('');
  const [aboutImageUrl, setAboutImageUrl] = useState('');
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

  // Centralized Media Library Helpers
  async function fetchMediaFiles() {
    setMediaLoading(true);
    try {
      const q = query(collection(db, 'media_library'), orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetched = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      setMediaFiles(fetched);
    } catch (err) {
      console.error("Error loading media library:", err);
    } finally {
      setMediaLoading(false);
    }
  }

  async function handleMediaUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setMediaUploading(true);
    try {
      const storagePath = `media/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      const mediaPayload = {
        url,
        storagePath,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };

      const newMediaDoc = await addDoc(collection(db, 'media_library'), mediaPayload);
      
      // If we are currently in the picker, auto-select this new image
      if (mediaPickerOpen) {
        setSelectedPickerId(newMediaDoc.id);
      }

      await fetchMediaFiles();
    } catch (err) {
      console.error("Failed to upload media:", err);
      alert("Failed to upload media asset to library.");
    } finally {
      setMediaUploading(false);
      e.target.value = ''; // Reset file input
    }
  }

  async function handleDeleteMedia(mediaId, storagePath, url) {
    if (!window.confirm("Are you sure you want to delete this media file? This will permanently delete it from storage and could break any pages/blogs referencing it.")) return;

    try {
      // 1. Delete document from Firestore
      await deleteDoc(doc(db, 'media_library', mediaId));

      // 2. Delete file from Storage
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn("Storage deletion warning:", err);
      }

      // 3. Clean up homepage photos grid if referencing this image
      const homepageQuery = query(collection(db, 'homepage_photos'), where('mediaId', '==', mediaId));
      const homepageSnap = await getDocs(homepageQuery);
      for (const d of homepageSnap.docs) {
        await deleteDoc(doc(db, 'homepage_photos', d.id));
      }

      // 4. Refresh lists
      await fetchMediaFiles();
      await fetchPhotos();
    } catch (err) {
      console.error("Error deleting media:", err);
      alert("Failed to delete media asset.");
    }
  }

  // Media Picker Dialog Promise Handlers
  function openMediaPicker() {
    setSelectedPickerId(null);
    return new Promise((resolve, reject) => {
      setMediaPickerOpen(true);
      setMediaPickerResolve(() => resolve);
      setMediaPickerReject(() => reject);
    });
  }

  function handleSelectMediaFromPicker(url) {
    if (mediaPickerResolve) {
      mediaPickerResolve(url);
    }
    closeMediaPicker();
  }

  function handleCancelMediaPicker() {
    if (mediaPickerReject) {
      mediaPickerReject(new Error("Cancelled"));
    }
    closeMediaPicker();
  }

  function closeMediaPicker() {
    setMediaPickerOpen(false);
    setSelectedPickerId(null);
    setMediaPickerResolve(null);
    setMediaPickerReject(null);
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
      // 1. Upload to storage
      const storagePath = `media/${Date.now()}_${newPhotoFile.name}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, newPhotoFile);
      const imageUrl = await getDownloadURL(fileRef);

      // 2. Add to media library
      const mediaPayload = {
        url: imageUrl,
        storagePath,
        filename: newPhotoFile.name,
        mimeType: newPhotoFile.type,
        size: newPhotoFile.size,
        uploadedAt: new Date().toISOString()
      };
      const newMediaDoc = await addDoc(collection(db, 'media_library'), mediaPayload);
      const mediaId = newMediaDoc.id;

      // 3. Add to homepage photos grid
      const order = photos.length > 0 ? Math.max(...photos.map(p => p.order || 0)) + 1 : 1;
      const newDoc = {
        mediaId,
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

  async function handleAddPhotoFromLibrary() {
    try {
      const url = await openMediaPicker();
      
      // Find mediaId from the url
      const mediaRef = collection(db, 'media_library');
      const q = query(mediaRef, where('url', '==', url));
      const snap = await getDocs(q);
      let mediaId = "";
      if (!snap.empty) {
        mediaId = snap.docs[0].id;
      }
      
      const order = photos.length > 0 ? Math.max(...photos.map(p => p.order || 0)) + 1 : 1;
      const newDoc = {
        mediaId,
        imageUrl: url,
        caption: "",
        order,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'homepage_photos'), newDoc);
      await fetchPhotos();
    } catch (err) {
      console.log("Adding grid photo from library cancelled or failed:", err.message);
    }
  }

  async function handleDeletePhoto(id) {
    if (!window.confirm("Are you sure you want to remove this photo from the homepage? (The source image will remain in your Media Library)")) return;

    try {
      // Only delete the grid linkage record, keeping physical asset in Media Library
      await deleteDoc(doc(db, 'homepage_photos', id));
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

  async function handleMovePhoto(index, direction) {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const updatedPhotos = [...photos];
    const temp = updatedPhotos[index];
    updatedPhotos[index] = updatedPhotos[targetIndex];
    updatedPhotos[targetIndex] = temp;

    try {
      const photoA = photos[index];
      const photoB = photos[targetIndex];

      // Swapping the order property between the two items in Firestore
      await updateDoc(doc(db, 'homepage_photos', photoA.id), { order: targetIndex });
      await updateDoc(doc(db, 'homepage_photos', photoB.id), { order: index });

      // Update local state order values
      updatedPhotos[index].order = index;
      updatedPhotos[targetIndex].order = targetIndex;

      setPhotos(updatedPhotos);
    } catch (err) {
      console.error("Error swapping photo order:", err);
      alert("Failed to update photo order.");
    }
  }

  // HTML5 Drag and Drop Handlers for Homepage Grid Ordering
  function handleDragStart(e, index) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Shift items locally for instant visual layout feedback
    const updatedPhotos = [...photos];
    const [draggedItem] = updatedPhotos.splice(draggedIndex, 1);
    updatedPhotos.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setPhotos(updatedPhotos);
  }

  async function handleDragEnd() {
    if (draggedIndex === null) return;
    setDraggedIndex(null);

    // Save final positions to Firestore in a single atomic batch
    try {
      const batch = writeBatch(db);
      photos.forEach((photo, idx) => {
        const docRef = doc(db, 'homepage_photos', photo.id);
        batch.update(docRef, { order: idx });
      });
      await batch.commit();

      // Clean order indices on local state
      const cleanedPhotos = photos.map((photo, idx) => ({ ...photo, order: idx }));
      setPhotos(cleanedPhotos);
    } catch (err) {
      console.error("Error saving drag reorder to database:", err);
      alert("Failed to save new photo order to the database. Reverting...");
      await fetchPhotos();
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
        setAboutImageUrl(data.imageUrl || '');
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
        imageUrl: aboutImageUrl,
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
    else if (activeTab === 'media') fetchMediaFiles();
  }, [activeTab]);

  useEffect(() => {
    if (mediaPickerOpen) {
      fetchMediaFiles();
    }
  }, [mediaPickerOpen]);

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
                  className={`admin-sidebar-link ${activeTab === 'media' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('media'); setArticleView('list'); }}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <FolderOpen size={16} /> Media Library
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

                <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--spacing-sm)' }}>
                  <button
                    type="submit"
                    className="admin-btn"
                    disabled={photoUploading}
                    style={{ margin: 0, width: 'auto', padding: 'var(--spacing-xs) var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Upload size={14} /> {photoUploading ? "Uploading..." : "Upload Photo"}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPhotoFromLibrary}
                    className="admin-btn secondary"
                    style={{ margin: 0, width: 'auto', padding: 'var(--spacing-xs) var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <FolderOpen size={14} /> Add from Library
                  </button>
                </div>
              </form>

              {/* List grid photos */}
              {photosLoading ? (
                <div className="flex-center"><div className="spinner"></div></div>
              ) : photos.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No homepage photos found.</p>
              ) : (
                <div className="admin-grid-manager">
                  {photos.map((photo, index) => (
                    <div 
                      key={photo.id} 
                      className={`admin-grid-card ${draggedIndex === index ? 'dragging' : ''}`}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <img src={photo.imageUrl} alt={photo.caption || "Grid item"} draggable="false" />
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div 
                              className="drag-handle" 
                              title="Drag to reorder" 
                              style={{ display: 'inline-flex', padding: '4px', cursor: 'grab' }}
                            >
                              <GripVertical size={16} style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(index, 'prev')}
                              disabled={index === 0}
                              className="icon-btn"
                              title="Move Backward"
                              style={{ padding: '4px', display: 'inline-flex', opacity: index === 0 ? 0.3 : 1, cursor: index === 0 ? 'not-allowed' : 'pointer' }}
                            >
                              <ArrowLeft size={16} />
                            </button>
                            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(index, 'next')}
                              disabled={index === photos.length - 1}
                              className="icon-btn"
                              title="Move Forward"
                              style={{ padding: '4px', display: 'inline-flex', opacity: index === photos.length - 1 ? 0.3 : 1, cursor: index === photos.length - 1 ? 'not-allowed' : 'pointer' }}
                            >
                              <ArrowRight size={16} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="icon-btn delete"
                            title="Remove Photo"
                            style={{ display: 'inline-flex', padding: '4px' }}
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
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const url = await openMediaPicker();
                                setArticleCoverUrl(url);
                              } catch (e) {}
                            }}
                            className="admin-btn secondary"
                            style={{ margin: 0, padding: '4px 12px', fontSize: '0.75rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FolderOpen size={12} /> Library
                          </button>
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
                          onImageSelectRequest={openMediaPicker}
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

                  <div className="form-group">
                    <label className="mono" style={{ fontSize: '0.75rem' }}>Profile Image</label>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={aboutImageUrl}
                        onChange={(e) => setAboutImageUrl(e.target.value)}
                        placeholder="Image URL"
                        style={{ flexGrow: 1 }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const url = await openMediaPicker();
                            setAboutImageUrl(url);
                          } catch (e) {
                            console.log("Cancelled select about image");
                          }
                        }}
                        className="admin-btn"
                        style={{ width: 'auto', margin: 0, padding: 'var(--spacing-sm) var(--spacing-md)' }}
                      >
                        <FolderOpen size={14} style={{ marginRight: '4px' }} /> Library
                      </button>
                    </div>
                    {aboutImageUrl && (
                      <div style={{ marginTop: 'var(--spacing-xs)', maxWidth: '150px' }}>
                        <img 
                          src={aboutImageUrl} 
                          alt="Profile Preview" 
                          style={{ width: '100%', height: 'auto', border: '1px solid var(--border-color)', display: 'block' }} 
                        />
                      </div>
                    )}
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

          {/* TAB 4: MEDIA LIBRARY */}
          {activeTab === 'media' && (
            <div>
              <div className="admin-header-row">
                <h2 style={{ fontFamily: 'var(--font-serif)' }}>Media Library</h2>
                <label className="admin-btn" style={{ width: 'auto', margin: 0, padding: 'var(--spacing-xs) var(--spacing-sm)', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <Upload size={14} /> {mediaUploading ? "Uploading..." : "Upload File"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleMediaUpload} 
                    disabled={mediaUploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {mediaLoading ? (
                <div className="flex-center"><div className="spinner"></div></div>
              ) : mediaFiles.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No media assets uploaded yet.</p>
              ) : (
                <div className="media-grid">
                  {mediaFiles.map(media => (
                    <div key={media.id} className="media-card" style={{ cursor: 'default' }}>
                      <div className="media-card-img-wrapper">
                        <img src={media.url} alt={media.filename} loading="lazy" />
                      </div>
                      <div className="media-card-details">
                        <span className="media-card-name" title={media.filename}>{media.filename}</span>
                        <span className="media-card-meta">
                          {(media.size / 1024).toFixed(0)} KB &bull; {new Date(media.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="media-card-actions">
                        <button 
                          type="button"
                          onClick={() => handleDeleteMedia(media.id, media.storagePath, media.url)}
                          className="icon-btn delete"
                          title="Delete Media Asset"
                          style={{ padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* MEDIA PICKER OVERLAY MODAL */}
      {mediaPickerOpen && (
        <div className="media-picker-overlay" onClick={handleCancelMediaPicker}>
          <div className="media-picker-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="media-picker-header">
              <h3 style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>Select Image</h3>
              <button onClick={handleCancelMediaPicker} className="icon-btn" title="Cancel">
                <X size={18} />
              </button>
            </div>
            
            <div className="media-picker-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="mono" style={{ fontSize: '0.8rem' }}>{mediaFiles.length} images available</span>
                
                <label className="admin-btn secondary" style={{ width: 'auto', margin: 0, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  <Upload size={12} /> {mediaUploading ? "Uploading..." : "Upload New File"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleMediaUpload} 
                    disabled={mediaUploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              
              {mediaLoading ? (
                <div className="flex-center"><div className="spinner"></div></div>
              ) : mediaFiles.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No images in library. Upload a file above.</p>
              ) : (
                <div className="media-grid">
                  {mediaFiles.map(media => (
                    <div 
                      key={media.id} 
                      className={`media-card ${selectedPickerId === media.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPickerId(media.id)}
                      onDoubleClick={() => handleSelectMediaFromPicker(media.url)}
                    >
                      <div className="media-card-img-wrapper">
                        <img src={media.url} alt={media.filename} loading="lazy" />
                      </div>
                      <div className="media-card-details">
                        <span className="media-card-name" title={media.filename}>{media.filename}</span>
                        <span className="media-card-meta">{(media.size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="media-picker-footer">
              <button 
                type="button" 
                className="admin-btn secondary" 
                onClick={handleCancelMediaPicker}
                style={{ margin: 0, padding: '8px 16px', width: 'auto', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="admin-btn" 
                disabled={!selectedPickerId}
                onClick={() => {
                  const selected = mediaFiles.find(m => m.id === selectedPickerId);
                  if (selected) {
                    handleSelectMediaFromPicker(selected.url);
                  }
                }}
                style={{ margin: 0, padding: '8px 24px', width: 'auto', fontSize: '0.85rem' }}
              >
                Select Image
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
