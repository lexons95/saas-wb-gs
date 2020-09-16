import mongoose from 'mongoose';
const dotenv = require('dotenv');
dotenv.config();

const CONNECTION_URL = process.env.CONNECTION_URL;

const clientOption = {
  socketTimeoutMS: 30000,
  keepAlive: true,
  reconnectTries: 30000,
  poolSize: 50,
  useNewUrlParser: true,
  autoIndex: false
};
const option = { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  poolSize: 50
};

const initDbConnection = async () => {
  const db = await mongoose.createConnection(CONNECTION_URL, option);
  db.on("error", console.error.bind(console, "MongoDB Connection Error>> : "));
  db.once("open", function() {
    console.log("client MongoDB Connection ok!");
  });
//   require('./model/user.js');
  return db;
};

export default {
    initDbConnection
};