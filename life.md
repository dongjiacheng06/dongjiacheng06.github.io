---
layout: homepage
og_image: https://dongjiacheng06.github.io/assets/images/photos/thumbs/20261024-guitarist.jpg
title: Life
description: Photographs by Jiacheng Dong.
---

<a class="life-back" href="/">&larr; Home</a>

## Life

<div class="photo-grid">
{% for photo in site.data.photos %}
  <figure class="photo-item">
    <a href="./assets/images/photos/full/{{ photo.file }}" target="_blank" rel="noopener">
      <img src="./assets/images/photos/thumbs/{{ photo.file }}" alt="{{ photo.alt }}" loading="lazy" decoding="async">
    </a>
    <figcaption>
      <span class="photo-date">{{ photo.date | date: "%b %-d, %Y" }}</span>
      <span class="photo-place">{{ photo.place }}</span>
    </figcaption>
  </figure>
{% endfor %}
</div>

<div class="photo-lightbox" id="photo-lightbox" hidden>
  <button type="button" class="photo-lightbox-close" aria-label="Close">&times;</button>
  <button type="button" class="photo-lightbox-nav photo-lightbox-prev" aria-label="Previous photo">&lsaquo;</button>
  <figure>
    <img alt="">
    <figcaption></figcaption>
  </figure>
  <button type="button" class="photo-lightbox-nav photo-lightbox-next" aria-label="Next photo">&rsaquo;</button>
</div>

<script>
  // Open photos in an overlay instead of a new tab. Without JS the links still open the full image.
  (function () {
    var box = document.getElementById('photo-lightbox');
    var links = Array.prototype.slice.call(document.querySelectorAll('.photo-item > a'));
    if (!box || !links.length) return;
    var img = box.querySelector('img'), cap = box.querySelector('figcaption'), idx = 0;
    function show(i) {
      idx = (i + links.length) % links.length;
      var a = links[idx], fig = a.parentNode;
      img.src = a.getAttribute('href');
      img.alt = a.querySelector('img').alt;
      cap.textContent = fig.querySelector('.photo-date').textContent + ' \u00b7 ' + fig.querySelector('.photo-place').textContent;
    }
    function open(i) { show(i); box.hidden = false; document.body.classList.add('photo-lightbox-open'); }
    function close() { box.hidden = true; img.removeAttribute('src'); document.body.classList.remove('photo-lightbox-open'); }
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;  // let modified clicks open a tab
        e.preventDefault(); open(i);
      });
    });
    box.querySelector('.photo-lightbox-close').addEventListener('click', close);
    box.querySelector('.photo-lightbox-prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.photo-lightbox-next').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
  })();
</script>
