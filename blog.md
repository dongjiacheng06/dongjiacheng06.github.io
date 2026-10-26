---
layout: homepage
title: Blog
description: Writing by Jiacheng Dong.
permalink: /blog/
sitemap: false
---

<a class="life-back" href="/">&larr; Home</a>

## Blog

{% if site.posts.size > 0 %}
{%- assign years = site.posts | group_by_exp: "post", "post.date | date: '%Y'" -%}
{%- for year in years %}
<h3 class="blog-year">{{ year.name }}</h3>
<div class="blog-list">
  {%- for post in year.items %}
  <div class="news-item blog-item">
    <span class="news-date">{{ post.date | date: "%b %-d" }}</span>
    <div class="news-body">
      <a class="blog-title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
      {%- if post.lang == "zh" %} <span class="blog-lang">中文</span>{% endif %}
      {%- if post.description %}
      <p class="blog-summary">{{ post.description }}</p>
      {%- endif %}
    </div>
  </div>
  {%- endfor %}
</div>
{%- endfor %}

{% else %}
<p class="blog-summary">Nothing here yet.</p>
{% endif %}
