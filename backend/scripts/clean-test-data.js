/**
 * Script: clean-test-data.js
 * Usage: NODE_ENV=development node scripts/clean-test-data.js
 * Connects to MONGO_URI in environment and deletes obvious test or gibberish items.
 */
const mongoose = require('mongoose');
require('dotenv').config();
const FoundItem = require('../models/foundItem');
const LostItem = require('../models/lostItem');

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('Missing MONGO_URI in environment');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to DB. Scanning for test entries...');

    // Patterns considered test/gibberish
    const junkTitles = [/^a+$/i, /^asdf/i, /\b(afasd|dsfsaf|gdf|dfs)\b/i, /^test$/i, /^123+$/i, /^[^A-Za-z0-9]{1,6}$/i];

    const predicate = { $or: [
      { title: { $in: ['afasd','dsfsaf','gdf','dfs','asdf','test'] } },
      { title: { $regex: /^(a|asdf|afasd|dsfsaf|gdf|dfs|test|123)+$/i } },
      { title: { $regex: /^.{0,2}$/ } },
      { title: { $regex: /[^a-zA-Z\s]{5,}/ } }
    ] };

    const foundToRemove = await FoundItem.find(predicate).lean();
    const lostToRemove = await LostItem.find(predicate).lean();

    console.log(`Found ${foundToRemove.length} found-items and ${lostToRemove.length} lost-items matching test patterns`);

    // Delete them
    if (foundToRemove.length) {
      const ids = foundToRemove.map(d => d._id);
      await FoundItem.deleteMany({ _id: { $in: ids } });
      console.log(`Deleted ${ids.length} found items`);
    }

    if (lostToRemove.length) {
      const ids = lostToRemove.map(d => d._id);
      await LostItem.deleteMany({ _id: { $in: ids } });
      console.log(`Deleted ${ids.length} lost items`);
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning test data:', err);
    process.exit(1);
  }
})();
