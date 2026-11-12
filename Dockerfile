# Use a lightweight Node.js LTS image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install production dependencies as root, then run the application as the
# non-root "node" user provided by the official Node image.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy only the build context permitted by .dockerignore and make runtime
# files readable by the non-root process.
COPY --chown=node:node . .

# Azure production uses the same certificate-verified Supabase pooler TLS root
# proven by the EOPS-001-C14 canary.
COPY supabase-root-2021.crt /usr/local/share/ca-certificates/supabase-root-2021.crt
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/supabase-root-2021.crt

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

USER node

CMD [ "node", "backend/server-express.js" ]
