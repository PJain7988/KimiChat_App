const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function seedSuggestions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const bots = [
      { name: 'James Wilson', username: 'james_w', email: 'james@example.com', bio: 'Tech enthusiast and mountain climber 🏔️' },
      { name: 'Sarah Miller', username: 'sarah_m', email: 'sarah@example.com', bio: 'Coffee lover and UI designer 🎨' },
      { name: 'David Chen', username: 'd_chen', email: 'david@example.com', bio: 'Full-stack dev & gamer 🎮' },
      { name: 'Elena Rossi', username: 'elena_r', email: 'elena@example.com', bio: 'Traveler and food blogger 🍕' },
      { name: 'Kimi Support', username: 'kimi_bot', email: 'bot@kimichat.app', bio: 'I am here to help you! 🤖' }
    ];

    for (const b of bots) {
      const exists = await User.findOne({ username: b.username });
      if (!exists) {
        await User.create({
          ...b,
          avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16),
          password: 'password123'
        });
        console.log(`Created bot: ${b.username}`);
      }
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedSuggestions();
