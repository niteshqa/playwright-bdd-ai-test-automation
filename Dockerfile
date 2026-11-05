# Official Playwright image: browsers + OS deps preinstalled, version-matched to @playwright/test.
FROM mcr.microsoft.com/playwright:v1.62.0-jammy

WORKDIR /app

COPY package*.json ./
# --ignore-scripts skips the husky `prepare` hook (no .git inside the image).
RUN npm ci --ignore-scripts

COPY . .

ENV CI=true

CMD ["npm", "run", "regression"]
