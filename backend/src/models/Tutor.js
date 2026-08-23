const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, default: 5.0 },
    reviews: { type: String, required: true },
    image: { type: String, required: true },
    hourlyRate: { type: Number, default: 45 },
    isFeatured: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tutor', tutorSchema);

