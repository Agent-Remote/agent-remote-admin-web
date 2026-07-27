# 06 Commands

## Setup And Run

```sh
npm ci
npm run dev
```

## Quality Gate

```sh
scripts/run-quality-checks.sh
```

Expanded commands:

```sh
bash -n scripts/*.sh
npm run build
npm test
git diff --check
```

Install repository hooks with `scripts/install-githooks.sh`. Use `npm install <package>` for intentional dependency changes so both package files stay synchronized.
