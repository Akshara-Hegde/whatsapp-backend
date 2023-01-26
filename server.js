//imports
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js"
import Pusher from "pusher";
import cors from "cors";

//app config

const app = express();
const port = process.env.PORT || 9001;
const pusher = new Pusher({
    appId: "1540494",
    key: "4db37a792b9d690e6426",
    secret: "ee9d250eb52827e04b0b",
    cluster: "ap2",
    useTLS: true
  });

  const db = mongoose.connection

  db.once('open',() => {
    console.log('db is connected');

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log('a change occured',change);

        if(change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            
            pusher.trigger("messages", "inserted", {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timeStamp: messageDetails.timeStamp,
                    received: messageDetails.received,
            })
            // console.log("inside pusher")
        } else {
            console.log("error triggering pusher");
        }
    })
  });

//middleware config
app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin","*");
//     res.setHeader("Access-Control-Allow-Headers","*");
//     next();
// });


//db config
const connection_url = 'mongodb+srv://akshar:8892494243@cluster0.e0f2cnk.mongodb.net/test';
mongoose.connect(connection_url);


//api routes


app.get('/',(req,res)=>res.status(200).send('hello'))

app.get('/messages/sync',(req,res) => {
    Messages.find((err,data) => {
        if(err){
            res.status(500).send(err)
        }
        else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body

    Messages.create(dbMessage, (err,data) => {
        if(err){
            res.status(500).send(err)
        }
        else{
            res.status(201).send(data)
        }
    })
})

app.listen(port,()=>console.log(`listeninh to localhost:${port}`))