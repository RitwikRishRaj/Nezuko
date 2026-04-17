Installation and Run guide:

cd backend/microservices/verify-codeforces-service
npm install
cd src
nodemon server.js

API:

Local endpoint: POST http://localhost:3001/verify-codeforces
//port 3001 is used
req.json: {"handle":"username"}

res.json: {"success": "true/false"}