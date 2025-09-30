Setup:

cd question-service
Run 'npm install'
cd src
nodemon server.js

Making a GET request:
(Development)
http://localhost:3000/questions/fetch?rating=1200&tags=implementation,math&count=5

adjust rating,tags,count according to preference, rest all is same for the development environment


To generate link to problem using the data provided by response.json:

https://codeforces.com/problemset/problem/{contestId}/{index}


