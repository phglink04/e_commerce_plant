const mongoose = require('mongoose');

const uri = 'mongodb+srv://ecommerce:9hcapFpqTBye50ad@cluster0.l7av3u0.mongodb.net/test?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');
    const chatbotSchema = new mongoose.Schema({}, { strict: false });
    const Chatbot = mongoose.model('Chatbot', chatbotSchema, 'chatbots');
    
    // Delete test users' sessions
    const deleteNames = ['Test User', 'Hà', 'Admin PlantWorld'];
    console.log(`Searching for test chatbot sessions with user names: ${deleteNames.join(', ')}`);
    
    const result = await Chatbot.deleteMany({ userName: { $in: deleteNames } });
    console.log(`Deleted ${result.deletedCount} test chatbot sessions.`);
    
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
