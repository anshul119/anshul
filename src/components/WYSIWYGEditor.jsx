import { useRef, useEffect } from 'react';
import { Bold, Italic, Link, Heading2, Heading3, Image, Code, Trash2 } from 'lucide-react';

export default function WYSIWYGEditor({ html, onChange, onImageSelectRequest }) {
  const editorRef = useRef(null);

  // Sync editor content with external state, but avoid cursor jumping on state updates
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html || '<p><br></p>';
    }
  }, [html]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const insertHtmlAtCursor = (htmlString) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const el = document.createElement("div");
    el.innerHTML = htmlString;
    const frag = document.createDocumentFragment();
    let node, lastNode;
    while ((node = el.firstChild)) {
      lastNode = frag.appendChild(node);
    }
    range.insertNode(frag);

    // Reposition cursor after the inserted element
    if (lastNode) {
      const newRange = range.cloneRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    handleInput();
  };

  const handleInsertImage = async () => {
    if (onImageSelectRequest) {
      try {
        const url = await onImageSelectRequest();
        if (url) {
          editorRef.current.focus();
          const imgHtml = `<img src="${url}" alt="" style="max-width: 100%; height: auto; display: block; margin: 2rem auto;" />`;
          insertHtmlAtCursor(imgHtml);
        }
      } catch (err) {
        console.warn("Image insert cancelled or failed:", err);
      }
    } else {
      const url = prompt("Enter Image URL:");
      if (url) {
        editorRef.current.focus();
        const imgHtml = `<img src="${url}" alt="" style="max-width: 100%; height: auto; display: block; margin: 2rem auto;" />`;
        insertHtmlAtCursor(imgHtml);
      }
    }
  };

  const handleInsertLink = () => {
    const url = prompt("Enter the URL:");
    if (!url) return;
    // Format URL if needed
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    executeCommand('createLink', formattedUrl);
  };

  const handleInsertEmbed = () => {
    const code = prompt("Paste your iframe embed code (e.g. YouTube/Vimeo sharing code):");
    if (!code) return;
    if (!code.includes('<iframe')) {
      alert("Invalid iframe code. Please paste a valid embed code.");
      return;
    }
    // Wrap iframe in our responsive aspect-ratio container
    const embedHtml = `<div class="block-embed" style="margin: 2rem 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"><div style="position: absolute; top:0; left:0; width:100%; height:100%;">${code}</div></div>`;
    insertHtmlAtCursor(embedHtml);
  };

  return (
    <div style={{ position: 'relative', minHeight: '500px', width: '100%' }}>
      
      {/* Editor Toolbar (Sticky & Centered Content) */}
      <div style={{ 
        position: 'sticky',
        top: '0',
        zIndex: 100,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        padding: '10px 0',
        width: '100%'
      }}>
        <div style={{
          maxWidth: '760px',
          margin: '0 auto',
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '6px', 
          alignItems: 'center',
          padding: '0 16px'
        }}>
          <button 
            type="button" 
            onClick={() => executeCommand('bold')} 
            className="icon-btn" 
            title="Bold"
            style={{ padding: '6px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Bold size={16} />
          </button>
          <button 
            type="button" 
            onClick={() => executeCommand('italic')} 
            className="icon-btn" 
            title="Italic"
            style={{ padding: '6px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Italic size={16} />
          </button>
          <button 
            type="button" 
            onClick={() => executeCommand('formatBlock', '<h2>')} 
            className="icon-btn" 
            title="Heading 2 (H2)"
            style={{ padding: '6px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Heading2 size={16} />
          </button>
          <button 
            type="button" 
            onClick={() => executeCommand('formatBlock', '<h3>')} 
            className="icon-btn" 
            title="Heading 3 (H3)"
            style={{ padding: '6px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Heading3 size={16} />
          </button>
          <button 
            type="button" 
            onClick={() => executeCommand('formatBlock', '<p>')} 
            className="icon-btn" 
            title="Paragraph"
            style={{ fontSize: '0.85rem', fontWeight: 'bold', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', minWidth: '28px', justifyContent: 'center' }}
          >
            P
          </button>
          
          <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>

          <button 
            type="button" 
            onClick={handleInsertLink} 
            className="icon-btn" 
            title="Insert Link"
            style={{ padding: '6px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Link size={16} />
          </button>

          <button 
            type="button" 
            onClick={handleInsertImage} 
            className="icon-btn" 
            title="Insert Image"
            style={{ padding: '6px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Image size={16} />
          </button>

          <button 
            type="button" 
            onClick={handleInsertEmbed} 
            className="icon-btn" 
            title="Insert Iframe Video"
            style={{ padding: '6px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Code size={16} />
          </button>

          <button 
            type="button" 
            onClick={() => executeCommand('removeFormat')} 
            className="icon-btn" 
            title="Clear Formatting"
            style={{ padding: '6px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{
          minHeight: '500px',
          outline: 'none',
          backgroundColor: 'transparent',
          lineHeight: '1.8',
          fontSize: '1.05rem',
          color: '#111111',
          maxWidth: '760px',
          margin: '0 auto',
          padding: '40px 16px',
          width: '100%',
          boxSizing: 'border-box'
        }}
        className="article-content html-content"
      />
    </div>
  );
}
