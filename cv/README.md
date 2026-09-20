# CV and Overleaf

Edit `main.tex` here; `resume.cls` supplies the style. The homepage CV button
opens `assets/pdf/cv.pdf`. Source and final PDF are public when pushed to GitHub.

Overleaf project: https://www.overleaf.com/project/68738fee05adfe9c675162a5

From the repository root:

```sh
python3 scripts/cv-sync.py status
python3 scripts/cv-sync.py pull
# Edit cv/main.tex
bash scripts/cv-build.sh
python3 scripts/cv-sync.py push --message "Update CV"
```

`pull` checks the latest Overleaf version before updating local source.
`push` uploads only `main.tex` and `resume.cls`, preserving other Overleaf files.
Both refuse conflicting changes; no force push is used. If both sides changed,
compare the latest Overleaf source in a temporary clone and merge deliberately.
Do not remove the tracked `.overleaf-state.json` to bypass a conflict.

Authentication uses macOS Keychain, never credentials in source files.
GitHub and Overleaf pushes are separate explicit actions; builds do not push.
After a successful sync, include `.overleaf-state.json` in your next Git commit.
The unrelated reference CV PDF on Overleaf is not imported or published.

Requires Python 3, Git, macOS Keychain credentials, and TeX Live/MacTeX with latexmk.
Jekyll excludes `cv/` and `scripts/`; only the compiled PDF is served.
