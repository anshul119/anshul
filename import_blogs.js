import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
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
  console.error("Usage: node import_blogs.js <admin_email> <admin_password>");
  process.exit(1);
}

// Path to the saved Squarespace JSON file
const jsonFilePath = "/Users/anshulsharma/.gemini/antigravity/brain/57aeadad-b386-4eed-ab6b-e75654f78fad/.system_generated/steps/151/content.md";

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

  // Sign in
  try {
    console.log(`Authenticating as ${email}...`);
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Authentication successful.");
  } catch (err) {
    console.error("Firebase Authentication failed. Check your email and password.", err.message);
    process.exit(1);
  }

  // Process and import
  let importedCount = 0;
  
  for (const item of items) {
    console.log(`\nProcessing: "${item.title}" (${item.urlId})`);
    
    // Convert publish timestamp to YYYY-MM-DD
    const date = new Date(item.publishOn).toISOString().split('T')[0];
    
    // Tag and category fallback
    const tag = (item.tags && item.tags[0]) || (item.categories && item.categories[0]) || "Journal";
    
    // Cover image fallback
    const coverImageUrl = item.assetUrl || "";
    
    // Parse the body HTML blocks using JSDOM
    const dom = new JSDOM(item.body || '');
    const doc = dom.window.document;
    
    // Select all potential blocks
    const sqsBlocks = doc.querySelectorAll('.sqs-block');
    const parsedBlocks = [];
    
    sqsBlocks.forEach((block) => {
      // 1. Check for Image Block
      if (block.classList.contains('image-block') || block.querySelector('img')) {
        const img = block.querySelector('img');
        if (img) {
          const imgUrl = img.getAttribute('data-src') || img.getAttribute('src');
          if (imgUrl) {
            // Check if it duplicates the cover image (ignoring query params)
            const cleanImgUrl = imgUrl.split('?')[0];
            const cleanCoverUrl = coverImageUrl.split('?')[0];
            if (cleanImgUrl === cleanCoverUrl) {
              console.log(`  -> Skipped duplicate cover image block: ${imgUrl.substring(0, 50)}...`);
              return;
            }

            // Find caption if available
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
      } 
      // 2. Check for Text Block
      else if (block.classList.contains('html-block') || block.classList.contains('markdown-block') || block.querySelector('.sqs-html-content')) {
        const textElements = block.querySelectorAll('.sqs-html-content p, .sqs-html-content h2, .sqs-html-content h3');
        const paragraphs = [];
        
        textElements.forEach(el => {
          let text = el.textContent.trim();
          if (text) {
            if (el.tagName.startsWith('H')) {
              // Format headings with bold caps in our text blocks
              text = `**${text.toUpperCase()}**`;
            }
            paragraphs.push(text);
          }
        });
        
        if (paragraphs.length > 0) {
          parsedBlocks.push({
            type: 'text',
            value: paragraphs.join('\n\n')
          });
          console.log(`  -> Extracted Text block (${paragraphs.length} paragraphs)`);
        }
      }
      // 3. Check for Iframe/Embed Block
      else if (block.querySelector('iframe')) {
        const iframe = block.querySelector('iframe');
        parsedBlocks.push({
          type: 'embed',
          code: iframe.outerHTML
        });
        console.log("  -> Extracted video iframe embed block");
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

    const articlePayload = {
      title: item.title,
      tag: tag,
      date: date,
      excerpt: cleanExcerpt,
      coverImageUrl: coverImageUrl,
      status: "published",
      blocks: parsedBlocks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Check if article with this title and date already exists to prevent duplicate runs
      const articlesRef = collection(db, 'articles');
      const q = query(articlesRef, where('title', '==', item.title), where('date', '==', date));
      const existingSnap = await getDocs(q);
      
      if (!existingSnap.empty) {
        console.log(`  -> Article already exists in Firestore. Skipping...`);
        continue;
      }

      await addDoc(collection(db, 'articles'), articlePayload);
      console.log(`  -> Successfully imported to Firestore!`);
      importedCount++;
    } catch (err) {
      console.error(`  -> Failed to import to Firestore:`, err.message);
    }
  }

  console.log(`\nMigration completed! Imported ${importedCount} new stories into Firestore.`);
  process.exit(0);
}

main();
