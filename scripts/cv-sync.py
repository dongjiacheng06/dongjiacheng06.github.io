#!/usr/bin/env python3
"""Explicit, conflict-checked synchronization of CV sources with Overleaf."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
CV = ROOT / 'cv'
STATE = CV / '.overleaf-state.json'
URL = 'https://git@git.overleaf.com/68738fee05adfe9c675162a5'
FILES = ('main.tex', 'resume.cls')


def git(repo, *args):
    return subprocess.check_output(
        ['git', '-c', 'credential.helper=', '-c', 'credential.helper=osxkeychain',
         '-C', str(repo), *args], text=True,
        env={**os.environ, 'GIT_TERMINAL_PROMPT': '0'}).strip()


def hashes(folder):
    return {name: hashlib.sha256((folder / name).read_bytes()).hexdigest()
            if (folder / name).exists() else None for name in FILES}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['status', 'pull', 'push'])
    parser.add_argument('--message', default='Update CV from homepage repository')
    args = parser.parse_args()
    baseline = json.loads(STATE.read_text())['sha256'] if STATE.exists() else None
    with tempfile.TemporaryDirectory(prefix='cv-overleaf-') as tmp:
        repo = Path(tmp) / 'remote'
        git(Path(tmp), 'clone', '--quiet', URL, str(repo))
        branch = git(repo, 'branch', '--show-current')
        remote, local = hashes(repo), hashes(CV)
        if any(value is None for value in remote.values()):
            raise SystemExit('Expected CV sources missing on Overleaf; inspect manually.')
        print('Overleaf branch:', branch)
        print('Local changes:', baseline is None or local != baseline)
        print('Remote changes:', baseline is None or remote != baseline)
        if args.action == 'status':
            return
        if args.action == 'pull':
            if local != remote and ((baseline is None and any(local.values()))
                                    or (baseline is not None and local != baseline)):
                raise SystemExit('Local CV differs from last sync. Commit/save and reconcile before pull; nothing overwritten.')
            CV.mkdir(exist_ok=True)
            for name in FILES:
                (CV / name).write_bytes((repo / name).read_bytes())
        else:
            if baseline is None:
                raise SystemExit('Run pull to establish a baseline first.')
            if remote != baseline and remote != local:
                raise SystemExit('Overleaf changed since last sync. Reconcile before push; nothing uploaded.')
            if any(value is None for value in local.values()):
                raise SystemExit('Local source missing; refusing to delete Overleaf files.')
            for name in FILES:
                (repo / name).write_bytes((CV / name).read_bytes())
            git(repo, 'add', '--', *FILES)
            if git(repo, 'diff', '--cached', '--name-only'):
                git(repo, '-c', 'user.name=' + git(ROOT, 'config', 'user.name'),
                    '-c', 'user.email=' + git(ROOT, 'config', 'user.email'),
                    'commit', '-m', args.message)
                git(repo, 'push', 'origin', 'HEAD:' + branch)
        STATE.write_text(json.dumps({'remote': URL, 'branch': branch,
                                    'commit': git(repo, 'rev-parse', 'HEAD'),
                                    'sha256': hashes(CV)}, indent=2) + '\n')
        print('CV', args.action, 'complete. Only', ', '.join(FILES), 'synchronized.')


if __name__ == '__main__':
    main()
