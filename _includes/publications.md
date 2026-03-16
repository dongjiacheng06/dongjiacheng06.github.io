<h2 id="publications" style="margin: 2px 0px -15px;">Publications</h2>

<div class="publications section-list">
<ol class="bibliography">

{% for link in site.data.publications.main %}
<li class="card-item">
  <div class="pub-row">
    {% if link.image %}
    <div class="col-sm-3 abbr" style="position: relative; padding-right: 15px; padding-left: 15px;">
      <div class="teaser-frame">
        <img src="{{ link.image }}" class="teaser img-fluid z-depth-1" style="width=100;height=40%">
      </div>
    </div>
    <div class="col-sm-9" style="position: relative; padding-right: 15px; padding-left: 20px;">
    {% else %}
    <div class="col-sm-12" style="position: relative; padding-right: 15px; padding-left: 15px;">
    {% endif %}
      <div class="title">{{ link.title }}</div>
      {% if link.authors %}
      <div class="author">{{ link.authors }}</div>
      {% endif %}
      <div class="periodical"><em>{{ link.conference }}</em></div>
      <div class="links">
        {% if link.arxiv %}
        <a href="{{ link.arxiv }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">arXiv</a>
        {% endif %}
        {% if link.code %}
        <a href="{{ link.code }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">Code</a>
        {% endif %}
        {% if link.page %}
        <a href="{{ link.page }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">Project</a>
        {% endif %}
        {% if link.notes %}
        <strong><i style="color:#e74d3c">{{ link.notes }}</i></strong>
        {% endif %}
      </div>
    </div>
  </div>
</li>
<br>
{% endfor %}

</ol>
</div>
