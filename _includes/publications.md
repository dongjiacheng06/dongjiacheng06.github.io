<h2 id="publications">Publications</h2>

<div class="publication-filters" role="tablist" aria-label="Publications">
  <button id="selected-tab" type="button" role="tab" aria-selected="true" aria-controls="selected-panel" data-publication-filter="selected">Selected Publications</button>
  <button id="all-tab" type="button" role="tab" aria-selected="false" aria-controls="all-panel" tabindex="-1" data-publication-filter="all">All Publications</button>
</div>

<div id="selected-panel" class="publications section-list publication-panel" role="tabpanel" aria-labelledby="selected-tab" tabindex="0">
<ol class="bibliography">

{% for link in site.data.publications.main %}
{% if link.selected %}
{% include publication-card.html publication=link %}
{% endif %}
{% endfor %}

</ol>
</div>

<div id="all-panel" class="publication-panel" role="tabpanel" aria-labelledby="all-tab" tabindex="0" hidden>
<ol class="all-publications-list">
{% for link in site.data.publications.main %}
  <li>
    <div class="publication-title">{% if link.arxiv %}<a href="{{ link.arxiv }}" target="_blank" rel="noopener">{{ link.title }}</a>{% else %}{{ link.title }}{% endif %}</div>
    <div class="publication-authors">{{ link.authors }}</div>
    <div class="publication-venue">{{ link.conference | default: link.notes }}</div>
  </li>
{% endfor %}
</ol>
</div>

<script>
  (function () {
    var buttons = document.querySelectorAll('[data-publication-filter]');
    function activate(button) {
      buttons.forEach(function (item) {
        var active = item === button;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
        document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
      });
    }
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        activate(button);
      });
      button.addEventListener('keydown', function (event) {
        var index = Array.prototype.indexOf.call(buttons, button);
        if (event.key === 'ArrowRight') index = (index + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') index = (index + buttons.length - 1) % buttons.length;
        else if (event.key === 'Home') index = 0;
        else if (event.key === 'End') index = buttons.length - 1;
        else return;
        event.preventDefault();
        activate(buttons[index]);
        buttons[index].focus();
      });
    });
  })();
</script>
