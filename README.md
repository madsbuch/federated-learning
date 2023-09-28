# Federeated Learning Workbench

This repo is my workbench to explore federated learning. Everything here is
subject to change, though I will do my best to keep documents up to date.

Feel free to reach out if you want to talk about the material!

## Getting Started

1. Clone this repo
2. `bun install` in the root - This is a mono repo and this command will isntall all dependencies
3. Start services
   - `(cd packages/client ; bun dev)` for the frontend service
   - `(cd packages/server ; bun --hot src/index.ts)` for the frontend service

## Deploying

- Frontend: automatic through Netlify
- Backend: `fly deploy`
