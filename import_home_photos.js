import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { JSDOM } from 'jsdom';

// Firebase credentials
const firebaseConfig = {
  apiKey: "AIzaSyCpkCYLIKfVjAo3Q7vfhH3eyelfZQL4YTc",
  authDomain: "anshul-art.firebaseapp.com",
  projectId: "anshul-art",
  storageBucket: "anshul-art.firebasestorage.app",
  messagingSenderId: "816756444698",
  appId: "1:816756444698:web:c002902ec635c0d0d48ba3"
};

// Check arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node import_home_photos.js <admin_email> <admin_password>");
  process.exit(1);
}

function getFilename(url) {
  const clean = url.split('?')[0];
  const parts = clean.split('/');
  return parts[parts.length - 1] || 'image.jpg';
}

async function main() {
  console.log("Fetching live homepage HTML...");
  let html;
  try {
    const response = await fetch('https://www.anshul.art');
    html = await response.text();
  } catch (err) {
    console.error("Failed to fetch live homepage:", err.message);
    process.exit(1);
  }

  console.log("Parsing HTML with JSDOM...");
  const dom = new JSDOM(html);
  const docObj = dom.window.document;

  // Find all figure elements representing strips items
  const galleryItems = docObj.querySelectorAll('figure.gallery-strips-item img');
  console.log(`Found ${galleryItems.length} potential homepage photo grid images in DOM.`);

  if (galleryItems.length === 0) {
    console.warn("No gallery images found with 'figure.gallery-strips-item img' selector.");
    process.exit(0);
  }

  // Extract source URLs
  const imgList = [];
  galleryItems.forEach((img, idx) => {
    const src = img.getAttribute('data-src') || img.getAttribute('src');
    const alt = img.getAttribute('alt') || '';
    if (src) {
      // Squarespace CDN URL formatting: request high res format (1500w)
      const cleanSrc = src.split('?')[0];
      const highResUrl = `${cleanSrc}?format=1500w`;
      imgList.push({
        index: idx,
        url: highResUrl,
        filename: getFilename(cleanSrc),
        caption: alt.trim()
      });
    }
  });

  console.log(`Successfully mapped ${imgList.length} images to import.`);

  // Initialize Firebase
  console.log("Connecting to Firebase...");
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Authenticate
  try {
    console.log(`Authenticating as ${email}...`);
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Authentication successful.");
  } catch (err) {
    console.error("Firebase Authentication failed:", err.message);
    process.exit(1);
  }

  console.log("\nStarting import process. This may take a few minutes...");
  let importedCount = 0;
  
  for (const item of imgList) {
    console.log(`\n[${item.index + 1}/${imgList.length}] Processing "${item.filename}"`);
    
    try {
      // 1. Check if this file is already in media_library to avoid redundant uploads
      const mediaRef = collection(db, 'media_library');
      const q = query(mediaRef, where('filename', '==', item.filename));
      const existingSnap = await getDocs(q);
      
      let mediaDocId;
      let finalUrl;
      let finalPath;

      if (!existingSnap.empty) {
        const existingData = existingSnap.docs[0].data();
        mediaDocId = existingSnap.docs[0].id;
        finalUrl = existingData.url;
        finalPath = existingData.storagePath;
        console.log(`  -> Image already uploaded. Reusing media record (ID: ${mediaDocId})`);
      } else {
        // 2. Download high-res image
        console.log(`  -> Downloading image from: ${item.url}`);
        const imgRes = await fetch(item.url);
        if (!imgRes.ok) {
          throw new Error(`HTTP error downloading image! Status: ${imgRes.status}`);
        }
        
        const buffer = await imgRes.arrayBuffer();
        const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        const size = buffer.byteLength;
        
        // 3. Upload to Firebase Storage
        const storagePath = `media/${Date.now()}_${item.filename}`;
        console.log(`  -> Uploading to Storage: ${storagePath} (${(size / (1024 * 1024)).toFixed(2)} MB)`);
        const fileRef = ref(storage, storagePath);
        
        await uploadBytes(fileRef, new Uint8Array(buffer), { contentType: mimeType });
        finalUrl = await getDownloadURL(fileRef);
        finalPath = storagePath;
        
        // 4. Create record in media_library
        const mediaPayload = {
          url: finalUrl,
          storagePath: finalPath,
          filename: item.filename,
          mimeType: mimeType,
          size: size,
          uploadedAt: new Date().toISOString()
        };
        
        const newMediaDoc = await addDoc(mediaRef, mediaPayload);
        mediaDocId = newMediaDoc.id;
        console.log(`  -> Cataloged in media_library with ID: ${mediaDocId}`);
      }

      // 5. Create/update record in homepage_photos grid
      // Query to check if this image is already in the homepage grid
      const gridRef = collection(db, 'homepage_photos');
      const gridQuery = query(gridRef, where('mediaId', '==', mediaDocId));
      const gridSnap = await getDocs(gridQuery);

      const gridPayload = {
        mediaId: mediaDocId,
        imageUrl: finalUrl,
        caption: item.caption,
        order: item.index,
        createdAt: new Date().toISOString()
      };

      if (!gridSnap.empty) {
        // Update order/caption if it exists
        const gridDocId = gridSnap.docs[0].id;
        await setDoc(doc(db, 'homepage_photos', gridDocId), gridPayload, { merge: true });
        console.log(`  -> Updated existing homepage grid photo (ID: ${gridDocId}) at order ${item.index}`);
      } else {
        // Add new grid document
        const newGridDoc = await addDoc(gridRef, gridPayload);
        console.log(`  -> Added to homepage_photos grid (ID: ${newGridDoc.id}) at order ${item.index}`);
      }
      
      importedCount++;
    } catch (err) {
      console.error(`  -> Failed to import image:`, err.message);
    }
  }

  console.log(`\nImport process finished! Successfully imported/mapped ${importedCount} of ${imgList.length} images.`);
  process.exit(0);
}

main().catch(err => console.error("Critical error in scraper main:", err));
