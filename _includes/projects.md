<h2 id="selected-projects" style="margin: 2px 0px -15px;">Selected Projects</h2>

<div class="publications section-list">
<ol class="bibliography">

{% for link in site.data.projects.main %}
<li class="card-item">
  <div class="pub-row">
    {% if link.image %}
    <div class="col-sm-3 abbr" style="position: relative; padding-right: 15px; padding-left: 15px;">
      <img src="{{ link.image }}" class="teaser img-fluid z-depth-1" style="width=100;height=40%">
    </div>
    <div class="col-sm-9" style="position: relative; padding-right: 15px; padding-left: 20px;">
    {% else %}
    <div class="col-sm-12" style="position: relative; padding-right: 15px; padding-left: 15px;">
    {% endif %}
      <div class="title">{{ link.title }}</div>
      {% if link.summary %}
      <div class="periodical">{{ link.summary }}</div>
      {% endif %}
      <div class="links">
        {% if link.code %}
        <a href="{{ link.code }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">{{ link.code_label | default: "Code" }}</a>
        {% endif %}
        {% if link.page %}
        <a href="{{ link.page }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">Project Page</a>
        {% endif %}
        {% if link.badge %}
        <a class="link-badge" href="{{ link.code }}" target="_blank" rel="noopener">
          <img src="{{ link.badge }}" alt="{{ link.badge_alt | default: 'badge' }}">
        </a>
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
