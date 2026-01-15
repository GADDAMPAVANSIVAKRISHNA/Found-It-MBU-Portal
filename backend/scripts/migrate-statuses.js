// Usage: node migrate-statuses.js [--apply]
// By default runs in dry-run mode and prints what would change.

const mongoose = require('mongoose');
const FoundItem = require('../models/FoundItem');
const LostItem = require('../models/LostItem');
const { normalizeFoundStatus, normalizeLostStatus } = require('../utils/statusUtils');
require('dotenv').config();

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/found-it-dev';
const apply = process.argv.includes('--apply');

(async () => {
  try {
    console.log('Connecting to DB:', MONGO);
    await mongoose.connect(MONGO, { dbName: undefined });

    const founds = await FoundItem.find({});
    console.log(`Found ${founds.length} FoundItem documents`);

    const foundUpdates = [];
    for (const f of founds) {
      const prev = f.status;
      const normalized = normalizeFoundStatus(prev);
      if (prev !== normalized) {
        foundUpdates.push({ id: f._id.toString(), from: prev, to: normalized });
        if (apply) {
          f.status = normalized;
          await f.save();
        }
      }
    }

    const losts = await LostItem.find({});
    console.log(`Found ${losts.length} LostItem documents`);

    const lostUpdates = [];
    for (const l of losts) {
      const prev = l.status;
      const normalized = normalizeLostStatus(prev);
      if (prev !== normalized) {
        lostUpdates.push({ id: l._id.toString(), from: prev, to: normalized });
        if (apply) {
          l.status = normalized;
          await l.save();
        }
      }
    }

    console.log('\nFoundItem status updates (sample 20):');
    console.table(foundUpdates.slice(0, 20));

    console.log('\nLostItem status updates (sample 20):');
    console.table(lostUpdates.slice(0, 20));

    console.log('\nSummary:');
    console.log(`FoundItems to update: ${foundUpdates.length}`);
    console.log(`LostItems to update: ${lostUpdates.length}`);

    if (!apply) {
      console.log('\nDry-run complete. To apply changes run: node migrate-statuses.js --apply');
    } else {
      console.log('\nMigration applied successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err && err.message);
    process.exit(2);
  }
})();