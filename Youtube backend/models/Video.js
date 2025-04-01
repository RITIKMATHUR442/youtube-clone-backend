const mongoose = require('mongoose');
const VideoSchema = new mongoose.Schema({
  tittle: { type: String, required: true },
  description: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  videoUrl: { type: String, required: true },
  videoId: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  thumbnailId: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  videoType:{type:String,default:"All"},
  views: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);
