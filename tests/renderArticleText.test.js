import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import renderArticleText from '../src/components/renderArticleText.js';

globalThis.DOMParser = new JSDOM('').window.DOMParser;

function render(text) {
  return renderToStaticMarkup(createElement('p', null, renderArticleText(text)));
}

test('renders imported emphasis, bold, links, breaks, and HTML entities', () => {
  assert.equal(
    render('Alps &amp; lakes <em>at dawn</em> <strong>Nutrition</strong><br><a href="/stories/hike" target="_blank">Hike</a>'),
    '<p>Alps &amp; lakes <em>at dawn</em> <strong>Nutrition</strong><br/><a href="/stories/hike" target="_blank" rel="noopener noreferrer">Hike</a></p>',
  );
});

test('preserves plain text and literal comparisons', () => {
  assert.equal(render('Altitude < 4000 & distance > 10'), '<p>Altitude &lt; 4000 &amp; distance &gt; 10</p>');
});

test('drops executable markup and unsafe URLs while retaining readable text', () => {
  assert.equal(
    render('<script>alert(1)</script><img src=x onerror="alert(1)"><em onclick="alert(1)">Safe</em><a href="javascript:alert(1)">link</a>'),
    '<p><em>Safe</em><a>link</a></p>',
  );
});
