document.addEventListener('DOMContentLoaded', function () {
    const tabGroups = document.querySelectorAll('[data-tab-group]');

    tabGroups.forEach(function (group) {
        const section = group.closest('#experiments') || group.parentElement;
        const buttons = section.querySelectorAll('.experiment-tab[data-panel]');
        const panels = group.querySelectorAll('.experiment-panel[data-panel]');

        if (!buttons.length || !panels.length) {
            return;
        }

        function activate(panelName) {
            buttons.forEach(function (button) {
                const isActive = button.dataset.panel === panelName;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-selected', String(isActive));
            });

            panels.forEach(function (panel) {
                const isActive = panel.dataset.panel === panelName;
                panel.classList.toggle('is-active', isActive);
                panel.hidden = !isActive;
            });
        }

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                activate(button.dataset.panel);
            });
        });

        const defaultButton = section.querySelector('.experiment-tab.is-active') || buttons[0];
        activate(defaultButton.dataset.panel);
    });

    const copyButtons = document.querySelectorAll('[data-copy-target]');

    copyButtons.forEach(function (button) {
        const defaultLabel = button.dataset.copyDefault || button.textContent.trim() || 'Copy';
        let resetTimer = null;

        async function copyTarget() {
            const targetId = button.dataset.copyTarget;
            const target = targetId ? document.getElementById(targetId) : null;

            if (!target) {
                return;
            }

            const text = target.textContent || '';

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(target);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    document.execCommand('copy');
                    selection.removeAllRanges();
                }

                button.textContent = 'Copied';
                button.classList.add('is-copied');
            } catch (error) {
                button.textContent = 'Failed';
                button.classList.remove('is-copied');
            }

            window.clearTimeout(resetTimer);
            resetTimer = window.setTimeout(function () {
                button.textContent = defaultLabel;
                button.classList.remove('is-copied');
            }, 1600);
        }

        button.addEventListener('click', copyTarget);
    });
});
