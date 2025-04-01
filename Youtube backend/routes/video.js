const express = require('express');
const Router = express.Router();
const checkAuth = require('../middleware/checkAuth');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const Video = require('../models/Video');
const mongoose = require('mongoose');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

// get all videos

Router.get('/all-video',async(req,res)=>{
{
    try {
        const videos=await Video.find();
        console.log(videos)
        return res.status(200).json({allvideos:videos});
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:error})
    }
}

})
// get own video
Router.get('/own-video',checkAuth,async(req,res)=>{
    try
    {
        const token = req.headers.authorization.split(" ")[1]
        const user = await jwt.verify(token, 'sbs online classes 123');
        console.log(user);
        const videos = await Video.find({user_id:user._id}).populate('user_id', 'channelName logoUrl subscribers description')
        res.status(200).json({
            videos:videos
        })
        
    }
    catch(err)
    {
        console.log(err);
        res.status().json({
            error:err
        })
        
    }
})


// Upload a new video
Router.post('/upload', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const user = await jwt.verify(token, 'sbs online classes 123');

        const uploadedVideo = await cloudinary.uploader.upload(req.files.video.tempFilePath, {
            resource_type: 'video',
        });
        const uploadedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath);

        const newVideo = new Video({
            _id: new mongoose.Types.ObjectId(),
            tittle: req.body.title,
            description: req.body.description,
            user_id: user._id,
            videoUrl: uploadedVideo.secure_url,
            videoId: uploadedVideo.public_id,
            thumbnailUrl: uploadedThumbnail.secure_url,
            thumbnailId: uploadedThumbnail.public_id,
            category: req.body.category,
            tags: req.body.tags.split(","),
        });

        const newUploadedVideoData = await newVideo.save();
        res.status(200).json({
            newVideo: newUploadedVideoData,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err,
        });
    }
});

// Update video details

Router.put('/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], 'sbs online classes 123');
        const video = await Video.findById(req.params.videoId);

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        if (video.user_id == verifiedUser._id) {
            if (req.files) {
                // Update thumbnail and video details
                await cloudinary.uploader.destroy(video.thumbnailId);
                const updatedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath);

                const updatedData = {
                    tittle: req.body.title,
                    description: req.body.description,
                    category: req.body.category,
                    tags: req.body.tags.split(","),
                    thumbnailUrl: updatedThumbnail.secure_url,
                    thumbnailId: updatedThumbnail.public_id,
                };

                const updatedVideoDetail = await Video.findByIdAndUpdate(req.params.videoId, updatedData, { new: true });
                return res.status(200).json({
                    updatedVideo: updatedVideoDetail,
                });
            } else {
                // Update only text data
                const updatedData = {
                    tittle: req.body.title,
                    description: req.body.description,
                    category: req.body.category,
                    tags: req.body.tags.split(","),
                };

                const updatedVideoDetail = await Video.findByIdAndUpdate(req.params.videoId, updatedData, { new: true });
                return res.status(200).json({
                    updatedVideo: updatedVideoDetail,
                });
            }
        } else {
            return res.status(403).json({
                error: 'You do not have permission to update this video',
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err,
        });
    }
});

// delete api
Router.delete('/:videoId',checkAuth,async(req,res)=>{
    try
    {

        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], 'sbs online classes 123');
            console.log(verifiedUser);
            const video = await Video.findById(req.params.videoId)
            if(video.user_id == verifiedUser._id )
            {
                // delete video, thumnail and data from database
                await cloudinary.uploader.destroy(video.videoId, { resource_type: 'video' });
                await cloudinary.uploader.destroy(video.thumbnailId)
                const deletedResponse = await Video.findByIdAndDelete(req.params.videoId)
                res.status(200).json({
                    deletedResponse:deletedResponse
                })

            }
            else{
                return res.status(500).json({
                    err: 'unable to delete a data '
                })
            }

    }
    catch(err){
        console.log(err);
        res.status(500).json({

        })
        
    }

})

//------------------------------------------ LIKE API------------------------------------
Router.put('/like/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], 'sbs online classes 123');
        console.log(verifiedUser);

        const video = await Video.findById(req.params.videoId);
        console.log(video);

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        if (video.likedBy.includes(verifiedUser._id)) {
            return res.status(400).json({ error: 'Already liked' });
        }

        // Remove from dislikedBy if present
        if (video.dislikedBy.includes(verifiedUser._id)) {
            video.dislikes -= 1;
            video.dislikedBy = video.dislikedBy.filter(userId => userId.toString() !== verifiedUser._id);
        }

        video.likes += 1;
        video.likedBy.push(verifiedUser._id);

        await video.save();
        res.status(200).json({ msg: 'Liked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// -------------------------------------------Dislike api-----------------------------------------------

Router.put('/dislike/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], 'sbs online classes 123');
        console.log(verifiedUser);

        const video = await Video.findById(req.params.videoId);
        console.log(video);

        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        if (video.dislikedBy.includes(verifiedUser._id)) {
            return res.status(400).json({ error: 'Already disliked' });
        }

        // Remove from likedBy if present
        if (video.likedBy.includes(verifiedUser._id)) {
            video.likes -= 1;
            video.likedBy = video.likedBy.filter(userId => userId.toString() !== verifiedUser._id);
        }

        video.dislikes += 1;
        video.dislikedBy.push(verifiedUser._id);

        await video.save();
        res.status(200).json({ msg: 'Disliked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// ----------------------------------------------views api---------------------------------------

Router.put('/views/:videoId', async (req, res)=>{
    try 
    { 
        const video = await Video.findById(req.params.videoId);
       console.log(video) 
       video.views +=1;
       await video.save();
       res.status(200).json({
            msg:'ok'
       })
   }

   catch(err)
   {
       console.log(err);
       res.status(500).json({
           error:err
       })
       
   }
})





Router.get('/api/video/:videoId', async (req, res) => {
    try {
      const videoId = req.params.videoId;
      const video = await getVideoById(videoId); // Fetch the video from DB
  
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
  
      res.json({ video }); // Ensure you return a JSON object
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  


module.exports = Router;
