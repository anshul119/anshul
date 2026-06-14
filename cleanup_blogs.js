import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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
  console.error("Usage: node cleanup_blogs.js <admin_email> <admin_password>");
  process.exit(1);
}

function stripHtml(html) {
  if (!html) return "";
  // Strip HTML tags using regex
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function cleanUrl(url) {
  if (!url) return "";
  // Remove query params
  return url.split('?')[0];
}

function getAssetUuid(url) {
  if (!url) return null;
  const clean = url.split('?')[0];
  const segments = clean.split('/');
  if (segments.length >= 2) {
    return segments[segments.length - 2];
  }
  return null;
}

async function main() {
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
    console.error("Firebase Authentication failed.", err.message);
    process.exit(1);
  }

  try {
    console.log("Fetching all articles from Firestore...");
    const articlesCol = collection(db, 'articles');
    const snapshot = await getDocs(articlesCol);
    
    console.log(`Found ${snapshot.size} articles to clean up.`);
    let updatedCount = 0;

    for (const document of snapshot.docs) {
      const article = document.data();
      const articleId = document.id;
      let hasChanges = false;
      
      console.log(`\nReviewing: "${article.title}"`);
      
      // 1. Clean excerpt of any HTML tags
      let cleanExcerpt = article.excerpt || "";
      if (cleanExcerpt.includes("<") && cleanExcerpt.includes(">")) {
        cleanExcerpt = stripHtml(cleanExcerpt);
        console.log(`  -> Cleaned excerpt HTML: "${cleanExcerpt.substring(0, 60)}..."`);
        hasChanges = true;
      }

      // 2. Remove duplicate cover image from body blocks
      const coverUuid = getAssetUuid(article.coverImageUrl);
      let cleanBlocks = article.blocks || [];
      const originalBlockCount = cleanBlocks.length;
      
      if (coverUuid && cleanBlocks.length > 0) {
        cleanBlocks = cleanBlocks.filter(block => {
          if (block.type === 'single_photo') {
            const blockUuid = getAssetUuid(block.url);
            if (blockUuid && blockUuid === coverUuid) {
              console.log(`  -> Filtered out duplicate cover image block by UUID match (${coverUuid}): "${block.url.substring(0, 60)}..."`);
              return false; // Remove this block
            }
          }
          return true; // Keep block
        });
        
        if (cleanBlocks.length !== originalBlockCount) {
          hasChanges = true;
        }
      }

      // 3. Update document if there are changes
      if (hasChanges) {
        const articleRef = doc(db, 'articles', articleId);
        await updateDoc(articleRef, {
          excerpt: cleanExcerpt,
          blocks: cleanBlocks,
          updatedAt: new Date().toISOString()
        });
        console.log(`  -> Successfully updated article in Firestore.`);
        updatedCount++;
      } else {
        console.log("  -> No changes needed.");
      }
    }

    console.log(`\nCleanup completed! Successfully updated ${updatedCount} articles.`);
  } catch (err) {
    console.error("Error during cleanup:", err);
  }
  process.exit(0);
}

main();
