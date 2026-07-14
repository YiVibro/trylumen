const express = require('express');
const cors=require('cors');
require('dotenv').config();
const cookieParser=require('cookie-parser');

const authRoutes=require('./routes/auth');
const documentRoutes=require('./routes/document');
const searchRoutes=require('./routes/search');

const app=express();

// if(process.env.NODE_ENV==='development'){
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: false, 
// }));
// }
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, 
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth',authRoutes);
app.use('/api/documents',documentRoutes);
app.use('/api/search',searchRoutes);

app.get('/api/health',(req,res)=>{
    res.json({status:'ok',message:'trylumen API running'});
});

module.exports = app;