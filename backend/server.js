//importing
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import Messages from './dbMessages.js';

import Pusher from 'pusher';

//app config

const app = express();
const port = process.env.PORT || 9000; 

//middleware

app.use(cors());
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//DB config
const connection_url = "mongodb+srv://admin:7vAf5UrIsYedGmdR@cluster0.kqubu.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url,{
    useNewUrlParser:true,
    useUnifiedTopology: true
})


//PUSHER
const pusher = new Pusher({
    appId: "1366346",
    key: "f6ae037c34979036b162",
    secret: "2472a7c885538fb80149",
    cluster: "eu",
    useTLS: true
});

const db = mongoose.connection;

db.once('open', ()=>{
    console.log('DB Connected')

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change)=>{

        if(change.operationType == 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',{
                name:messageDetails.name,
                message:messageDetails.message,
                timestamp:messageDetails.timestamp,
                received: messageDetails.received
            });
        }else{
            console.log('Error triggering Pusher');
        }
    });
});



//API routes

app.get("/api/v1/messages/syncs", (req,res)=>{
    Messages.find((err,data)=>
        err ? res.status(500).json(err) : res.status(200).json(data)
    );
})

app.post('/api/v1/messages/new',(req,res) =>{
     const dbMessage = req.body;
     Messages.create(dbMessage, (err,data)=>
         err ? res.status(500).json(err) : res.status(201).json(data) 
     );
})

//listener
app.listen(port, ()=>console.log(`Listening on localhost:${port}`));

