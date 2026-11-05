import { createElement } from 'react';

const formattingTags = new Set(['a', 'em', 'strong', 'b', 'i', 'u', 's', 'br', 'code', 'sub', 'sup']);
const hiddenTags = new Set(['script', 'style', 'iframe', 'object', 'template']);

// Render legacy article markup without allowing executable HTML or attributes.
export default function renderArticleText(text) {
  const document = new DOMParser().parseFromString(text, 'text/html');

  function renderNode(node, key) {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;

    const tag = node.localName;
    if (hiddenTags.has(tag)) return null;
    const children = Array.from(node.childNodes, (child, index) => renderNode(child, index));
    if (!formattingTags.has(tag)) return children;

    const props = { key };
    if (tag === 'a') {
      const href = node.getAttribute('href');
      if (href) {
        try {
          const url = new URL(href, 'https://article.invalid');
          if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
            props.href = href;
          }
        } catch {
          // Keep the link text when its destination is invalid.
        }
      }
      if (node.getAttribute('target') === '_blank') {
        props.target = '_blank';
        props.rel = 'noopener noreferrer';
      }
    }
    return tag === 'br' ? createElement(tag, props) : createElement(tag, props, ...children);
  }

  return Array.from(document.body.childNodes, (node, index) => renderNode(node, index));
}
