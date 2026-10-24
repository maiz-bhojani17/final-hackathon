const mongoose = require('mongoose');

let retryInterval = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hcm_lite';
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    if (retryInterval) {
      clearInterval(retryInterval);
      retryInterval = null;
    }
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Local MongoDB on 127.0.0.1 not reachable (${error.message}).`);
    
    // Auto-launch In-Memory MongoDB Server so user needs ZERO setup!
    try {
      console.log('🔄 Launching embedded In-Memory MongoDB server (Zero-Setup Mode)...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({
        instance: { dbName: 'hcm_lite' }
      });
      const memoryUri = mongoServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`=======================================================`);
      console.log(`🎉 [MongoDB] In-Memory Server Active: ${memoryUri}`);
      console.log(`✅ App is running in 100% self-contained Zero-Setup mode!`);
      console.log(`=======================================================`);
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
      return conn;
    } catch (memErr) {
      console.warn(`[MongoDB In-Memory Note]: ${memErr.message}`);
    }

    console.warn('👉 Waiting for MongoDB service to start on mongodb://127.0.0.1:27017...');
    
    // Auto-reconnect poll every 4 seconds in background
    if (!retryInterval) {
      retryInterval = setInterval(async () => {
        if (mongoose.connection.readyState !== 1) {
          try {
            await mongoose.connect(uri, {
              autoIndex: true,
              serverSelectionTimeoutMS: 3000
            });
            console.log(`[MongoDB] Auto-reconnected successfully to: ${uri}`);
            clearInterval(retryInterval);
            retryInterval = null;
            
            const authService = require('../services/authService');
            await authService.seedDemoAccounts();
            console.log('✅ Demo accounts ready upon MongoDB connection!');
          } catch (e) {
            // Still waiting for MongoDB to start
          }
        }
      }, 4000);
    }
    return null;
  }
};

module.exports = connectDB;
