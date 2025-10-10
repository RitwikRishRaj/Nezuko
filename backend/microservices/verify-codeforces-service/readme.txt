Installation and Run guide:

cd backend/microservices/verify-codeforces
npm install
cd src
nodemon server.js

API:

Local endpoint: POST http://localhost:3000/verify-codeforces

req.json: {"handle":"username"}

res.json: {"success": "true/false"}