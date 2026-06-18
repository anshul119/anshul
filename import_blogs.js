import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
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
  console.error("Usage: node import_blogs.js <admin_email> <admin_password> [--overwrite] [--only <title>]");
  process.exit(1);
}

// Path to the saved Squarespace JSON file
const jsonFilePath = "/Users/anshulsharma/.gemini/antigravity/brain/57aeadad-b386-4eed-ab6b-e75654f78fad/.system_generated/steps/151/content.md";

// Helper to download image from Squarespace CDN, upload to Firebase Storage, and catalog in Media Library
async function uploadImageToFirebase(imageUrl, storage, db) {
  if (!imageUrl) return "";

  // Clean the URL (remove query params)
  const cleanUrl = imageUrl.split('?')[0];
  
  // Extract unique identifier from the Squarespace URL
  const parts = cleanUrl.split('/');
  const filename = parts[parts.length - 1] || 'image.jpg';
  const imageId = parts[parts.length - 2] || Date.now().toString();
  const storagePath = `media/imported_${imageId}_${filename}`;

  try {
    // 1. Check if this file is already in media_library to avoid redundant downloads
    const mediaRef = collection(db, 'media_library');
    const q = query(mediaRef, where('storagePath', '==', storagePath));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const existingUrl = snap.docs[0].data().url;
      console.log(`  -> Image already migrated: ${filename} (using existing URL)`);
      return existingUrl;
    }

    console.log(`  -> Downloading image: ${filename}...`);
    // Request at high resolution format=1500w to match homepage resolution
    const downloadUrl = cleanUrl.includes('squarespace-cdn.com') 
      ? `${cleanUrl}?format=1500w` 
      : imageUrl;
      
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
    
    const buffer = await res.arrayBuffer();
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    const size = buffer.byteLength;

    console.log(`  -> Uploading to Firebase Storage: ${storagePath} (${(size / 1024).toFixed(1)} KB)...`);
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, new Uint8Array(buffer), { contentType: mimeType });
    const firebaseUrl = await getDownloadURL(fileRef);

    // 2. Add catalog document in media_library
    const mediaPayload = {
      url: firebaseUrl,
      storagePath,
      filename,
      mimeType,
      size,
      uploadedAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'media_library'), mediaPayload);
    console.log(`  -> Successfully registered in Media Library!`);
    
    return firebaseUrl;
  } catch (err) {
    console.error(`  -> Failed to migrate image ${imageUrl}:`, err.message);
    // Return original URL as fallback so the import doesn't break
    return imageUrl;
  }
}

async function main() {
  console.log("Reading Squarespace JSON data...");
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`Error: Scraped data file not found at ${jsonFilePath}`);
    process.exit(1);
  }

  // Read file and skip first 8 header lines to get the raw JSON
  const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
  const lines = fileContent.split('\n');
  const jsonStartIdx = lines.findIndex(line => line.trim().startsWith('{'));
  
  if (jsonStartIdx === -1) {
    console.error("Error: Could not locate JSON content in the scraped file.");
    process.exit(1);
  }
  
  const rawJson = lines.slice(jsonStartIdx).join('\n');
  let data;
  try {
    data = JSON.parse(rawJson);
  } catch (err) {
    console.error("Error parsing JSON content:", err);
    process.exit(1);
  }

  const items = data.items || [];
  console.log(`Found ${items.length} stories in Squarespace export.`);

  if (items.length === 0) {
    console.log("No stories to import.");
    process.exit(0);
  }

  // Initialize Firebase
  console.log("Connecting to Firebase...");
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Sign in
  try {
    console.log(`Authenticating as ${email}...`);
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Authentication successful.");
  } catch (err) {
    console.error("Firebase Authentication failed. Check your email and password.", err.message);
    process.exit(1);
  }

  // Check filter flags
  const onlyTitleIndex = process.argv.indexOf('--only');
  const onlyTitle = onlyTitleIndex !== -1 ? process.argv[onlyTitleIndex + 1] : "";
  const isOverwrite = process.argv.includes('--overwrite') || process.argv.includes('-o');

  // Process and import
  let importedCount = 0;
  
  for (const item of items) {
    if (onlyTitle && !item.title.toLowerCase().includes(onlyTitle.toLowerCase())) {
      continue;
    }

    console.log(`\nProcessing: "${item.title}" (${item.urlId})`);
    
    // Convert publish timestamp to YYYY-MM-DD
    const date = new Date(item.publishOn).toISOString().split('T')[0];
    
    // Tag and category fallback
    const tag = (item.tags && item.tags[0]) || (item.categories && item.categories[0]) || "Journal";
    
    // Cover image fallback
    const coverImageUrl = item.assetUrl || "";
    
    // Parse the body HTML blocks using JSDOM
    const dom = new JSDOM(item.body || '');
    const docElement = dom.window.document;
    
    // Select all potential blocks
    const sqsBlocks = docElement.querySelectorAll('.sqs-block');
    const parsedBlocks = [];
    
    sqsBlocks.forEach((block) => {
      // 1. Check for Gallery Block
      const isGallery = block.classList.contains('gallery-block') || block.querySelector('.sqs-gallery');
      if (isGallery) {
        const imgs = block.querySelectorAll('img');
        let blockImgsCount = 0;
        imgs.forEach(img => {
          if (img.closest('noscript')) return; // skip duplicates
          
          const imgUrl = img.getAttribute('data-src') || img.getAttribute('src');
          if (imgUrl) {
            const cleanImgUrl = imgUrl.split('?')[0];
            const cleanCoverUrl = coverImageUrl.split('?')[0];
            if (cleanImgUrl === cleanCoverUrl) {
              console.log(`  -> Skipped duplicate cover image block: ${imgUrl.substring(0, 50)}...`);
              return;
            }
            parsedBlocks.push({
              type: 'single_photo',
              url: imgUrl,
              caption: ""
            });
            blockImgsCount++;
          }
        });
        if (blockImgsCount > 0) {
          console.log(`  -> Extracted Gallery: ${blockImgsCount} images`);
        }
        return;
      }

      // 2. Check for standard Image Block
      const isImageBlock = block.classList.contains('image-block') || (block.querySelector('img') && !block.querySelector('.sqs-gallery'));
      if (isImageBlock) {
        const img = block.querySelector('img');
        if (img && !img.closest('noscript')) {
          const imgUrl = img.getAttribute('data-src') || img.getAttribute('src');
          if (imgUrl) {
            const cleanImgUrl = imgUrl.split('?')[0];
            const cleanCoverUrl = coverImageUrl.split('?')[0];
            if (cleanImgUrl === cleanCoverUrl) {
              console.log(`  -> Skipped duplicate cover image block: ${imgUrl.substring(0, 50)}...`);
              return;
            }
            
            const captionEl = block.querySelector('.image-caption p, figcaption p');
            const caption = captionEl ? captionEl.textContent.trim() : "";
            
            parsedBlocks.push({
              type: 'single_photo',
              url: imgUrl,
              caption: caption
            });
            console.log(`  -> Extracted Image: ${imgUrl.substring(0, 50)}... (${caption})`);
          }
        }
        return;
      }

      // 3. Check for HTML / Text Block
      const isTextBlock = block.classList.contains('html-block') || block.classList.contains('markdown-block') || block.querySelector('.sqs-html-content');
      if (isTextBlock) {
        const textElements = block.querySelectorAll('p, h1, h2, h3, h4, ul, ol');
        const paragraphs = [];
        
        textElements.forEach(el => {
          if (el.closest('li') && el.tagName !== 'LI') return; // skip nested tags in lists
          
          let html = el.innerHTML.trim();
          if (html) {
            if (el.tagName.startsWith('H')) {
              paragraphs.push(`**${el.textContent.trim().toUpperCase()}**`);
            } else if (el.tagName === 'UL' || el.tagName === 'OL') {
              const itemsText = [];
              el.querySelectorAll('li').forEach(li => {
                itemsText.push(`- ${li.innerHTML.trim()}`);
              });
              paragraphs.push(itemsText.join('\n'));
            } else {
              paragraphs.push(html);
            }
          }
        });
        
        if (paragraphs.length > 0) {
          parsedBlocks.push({
            type: 'text',
            value: paragraphs.join('\n\n')
          });
          console.log(`  -> Extracted Text block (${paragraphs.length} elements)`);
        }
        return;
      }

      // 4. Check for Embed
      if (block.querySelector('iframe')) {
        const iframe = block.querySelector('iframe');
        parsedBlocks.push({
          type: 'embed',
          code: iframe.outerHTML
        });
        console.log("  -> Extracted video iframe embed block");
        return;
      }
    });

    // Check if we extracted any blocks. If not, write the raw body as a single text block
    if (parsedBlocks.length === 0 && item.body) {
      const plainText = item.body.replace(/<[^>]*>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean).join('\n\n');
      parsedBlocks.push({
        type: 'text',
        value: plainText
      });
      console.log("  -> Fallback: Extracted full text from HTML body");
    }

    // Strip HTML from excerpt
    const cleanExcerpt = item.excerpt 
      ? item.excerpt.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() 
      : "";

    // 3. Migrate Cover Image & body images to Firebase Storage
    console.log(`  -> Migrating cover image to Storage...`);
    const finalCoverUrl = await uploadImageToFirebase(coverImageUrl, storage, db);

    console.log(`  -> Migrating body images to Storage...`);
    for (const block of parsedBlocks) {
      if (block.type === 'single_photo' && block.url) {
        block.url = await uploadImageToFirebase(block.url, storage, db);
      }
    }

    const articlePayload = {
      title: item.title,
      tag: tag,
      date: date,
      excerpt: cleanExcerpt,
      coverImageUrl: finalCoverUrl,
      status: "published",
      blocks: parsedBlocks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Check if article with this title and date already exists
      const articlesRef = collection(db, 'articles');
      const q = query(articlesRef, where('title', '==', item.title), where('date', '==', date));
      const existingSnap = await getDocs(q);
      
      if (!existingSnap.empty) {
        if (isOverwrite) {
          console.log(`  -> Article exists in Firestore. Overwriting...`);
          const docId = existingSnap.docs[0].id;
          await updateDoc(doc(db, 'articles', docId), {
            ...articlePayload,
            updatedAt: new Date().toISOString()
          });
          console.log(`  -> Successfully updated!`);
          importedCount++;
        } else {
          console.log(`  -> Article already exists in Firestore. Skipping (use --overwrite to force update)...`);
        }
        continue;
      }

      await addDoc(collection(db, 'articles'), articlePayload);
      console.log(`  -> Successfully imported to Firestore!`);
      importedCount++;
    } catch (err) {
      console.error(`  -> Failed to import to Firestore:`, err.message);
    }
  }

  console.log(`\nMigration completed! Processed ${importedCount} stories into Firestore.`);
  process.exit(0);
}

main();
