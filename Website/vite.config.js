import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function privateDataPlugin() {
  const privateDir = path.resolve(__dirname, '../data');
  const privateFile = path.resolve(privateDir, 'user_profiles.private.json');

  return {
    name: 'private-data-api',
    configureServer(server) {
      // POST /api/save-user - Persist user profile to local private file
      server.middlewares.use('/api/save-user', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const userData = JSON.parse(body);
              if (!fs.existsSync(privateDir)) {
                fs.mkdirSync(privateDir, { recursive: true });
              }

              let existingData = [];
              if (fs.existsSync(privateFile)) {
                try {
                  const content = fs.readFileSync(privateFile, 'utf8');
                  existingData = JSON.parse(content);
                  if (!Array.isArray(existingData)) existingData = [existingData];
                } catch {
                  existingData = [];
                }
              }

              // Update if already exists with same phone number, otherwise append
              const index = existingData.findIndex(u => u.phoneNumber === userData.phoneNumber);
              const record = {
                ...userData,
                updatedAt: new Date().toISOString()
              };

              if (index >= 0) {
                existingData[index] = record;
              } else {
                existingData.push(record);
              }

              fs.writeFileSync(privateFile, JSON.stringify(existingData, null, 2), 'utf8');

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                message: 'Profile successfully saved to private file',
                filePath: 'data/user_profiles.private.json',
                data: record
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });

      // GET /api/get-users - Retrieve private profiles
      server.middlewares.use('/api/get-users', (req, res) => {
        if (req.method === 'GET') {
          try {
            if (fs.existsSync(privateFile)) {
              const content = fs.readFileSync(privateFile, 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.end(content);
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify([]));
            }
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), privateDataPlugin()],
});
