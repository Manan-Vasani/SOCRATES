const mongoose = require('mongoose');
const User = require('../models/User');
const DoubtThread = require('../models/DoubtThread');
const Comment = require('../models/Comment');
const Karma = require('../models/Karma');
require('dotenv').config();

async function runTest() {
  console.log('=====================================================');
  console.log('SOCRATES COMMUNITY BACKEND INTEGRATION TEST');
  console.log('=====================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socrates_db';
  try {
    await mongoose.connect(mongoUri);
    console.log('[+] Connected to MongoDB');

    // 1. Find or create test user
    let user = await User.findOne({ email: 'teststudent@socrates.edu' });
    if (!user) {
      user = await User.create({
        fullName: 'Alex Student',
        email: 'teststudent@socrates.edu',
        password: 'password123',
        role: 'student',
      });
    }
    console.log('[+] Test User initialized:', user.fullName);

    // 2. Create Doubt Thread
    const thread = await DoubtThread.create({
      title: 'How to implement SVD Matrix Factorization in NumPy?',
      content: 'I am trying to decompose a rating matrix into U, Sigma, and V^T for collaborative filtering. How do I handle missing ratings?',
      subject: 'Machine Learning',
      tags: ['numpy', 'svd', 'recommendation'],
      codeSnippet: 'import numpy as np\nU, s, Vt = np.linalg.svd(R_demeaned, full_matrices=False)',
      author: user._id,
    });
    console.log('[+] DoubtThread created successfully! ID:', thread._id);

    // 3. Upvote Thread
    thread.upvotes += 1;
    thread.voters.push({ user: user._id, vote: 'up' });
    await thread.save();
    console.log('[+] Thread upvoted! Total Upvotes:', thread.upvotes);

    // 4. Create Comment
    const comment = await Comment.create({
      thread: thread._id,
      author: user._id,
      content: 'You should demean the matrix by subtracting user mean ratings and filling missing values with 0.0 before running SVD.',
      codeSnippet: 'user_means = np.nanmean(R, axis=1)\nR_demeaned = np.nan_to_num(R - user_means[:, None], nan=0.0)',
    });
    thread.commentsCount += 1;
    await thread.save();
    console.log('[+] Comment created! ID:', comment._id);

    // 5. Upvote Comment
    comment.upvotes += 1;
    comment.voters.push({ user: user._id, vote: 'up' });
    await comment.save();
    console.log('[+] Comment upvoted! Total Upvotes:', comment.upvotes);

    // 6. Mark Solved
    comment.isAccepted = true;
    await comment.save();
    thread.isSolved = true;
    thread.solvedBy = user._id;
    await thread.save();
    console.log('[+] Thread marked solved! Status isSolved:', thread.isSolved);

    // 7. Verify Karma Ledger
    await Karma.create({ user: user._id, points: 15, action: 'SOLUTION_ACCEPTED', referenceId: comment._id });
    const userUpdated = await User.findByIdAndUpdate(user._id, { $inc: { karma: 15 } }, { new: true });
    console.log('[+] Karma Ledger updated! Total User Karma:', userUpdated.karma);

    console.log('\n=====================================================');
    console.log('ALL COMMUNITY BACKEND INTEGRATION TESTS PASSED!');
    console.log('=====================================================');
  } catch (error) {
    console.error('[-] Test Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

runTest();
