import express from 'express';
import Worker from './worker';
import Permutation from './permutation';
     
const app = express();
const port = 5000;
const worker = new Worker();

app.use(express.json());

app.post("/api/hash/crack", function(req, res) {
    
});

app.get("/api/hash/status:requestId", function(req, res) {
    
});

// app.listen(port, function() {
//     console.log("Worker started");
// });