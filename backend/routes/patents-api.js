const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const db = mongoose.connection.db
// This is the model of the patents
const Patent = require("../models/patent_model");

// Import label model
const Label = require("../models/label_model");

// Import queue model
const Queue = require("../models/queue_model");
const e = require("express");

/**
 * ONLY if the queue is empty:
 * Adds 10 random unannotated patents to the users queue.
 * @return {List} of patents in the queue for the current user.
 */
async function getPatentQueue(req)
{
  const queue = await Queue.find({
    "userId":  req.user._id
  });

  // current user has a queue entry in the database:
  if (queue.length !== 0)
  {
    // a single user should only have 1 queue entry,
    // so, safe to only check queue[0]
    if(queue[0].items.length > 0)
    {
      return await Patent.find({
        documentId: queue[0].items
      });
    }
    else // let's add some new patents:
    {
      var alreadyLabeled = await Label.find().select(['-_id', 'document']);
      alreadyLabeled = alreadyLabeled.map((id) => {return id.document; }); // extract only the documentId
      
      const patents = await Patent.aggregate([
        { $match: { documentId: { $nin: alreadyLabeled }}},
        { $sample: { size: 10 } }
      ]); // find 10 random patents

      const patentIds = patents.map((id) => { return id.documentId; }) // extract only the patentId

      await Queue.updateOne(
        { _id: queue[0]._id },
        { items: patentIds }
      );

      return patents;
    }   
  }
  else // current user does not have a queue in the database (yet):
  {
    var alreadyLabeled = await Label.find().select(['-_id', 'document']);
    alreadyLabeled = alreadyLabeled.map((id) => {return id.document; }); // extract only the documentId
      
    const patents = await Patent.aggregate([
      { $match: { documentId: { $nin: alreadyLabeled }}},
      { $sample: { size: 10 } }
    ]); // find 10 random patents
      
    const patentIds = patents.map((id) => { return id.documentId; }) // extract only the patentId
    
    const queue = new Queue({
      userId: req.user._id,
      items: patentIds
    });

    await queue.save();
    return patents;
  }
}

/**
 * GETs patents from the database.
 * IF the user has items in their queue:
 *    the entire queue will be sent to frontend.
 * ELSE
 *    the user will receive 10 random patents in their queue.
 *    the entire new queue will be sent to frontend.
*/
router.get("/", async function (req, res, next) {
  try {
    res.json(await getPatentQueue(req));
  } 
  catch (error) {
    res.status(500).json({ error: error });
  }
});

// This route is sending a post to the DB with labeling information aswell as documentid and userid
router.post("/labels", async function (req, res, next) { 
  try
  {
    const annotation = await Label.findOne({
      document: req.body.documentId
    });
    
    // check if there is already an annotation in the database:
    if (annotation !== null) // let's update it:
    {
      const result = await Label.updateOne(
        { _id: annotation._id },
        {
          mal:req.body.mal, // Machine Learning
          hdw:req.body.hdw, // Hardware
          evo:req.body.evo, // Evolution
          spc:req.body.spc, // speech
          vis:req.body.vis, // Vision
          nlp:req.body.nlp, // Natural Language Processing 
          pln:req.body.pln, // Planning 
          kpr:req.body.kpr, // Knowledge Processing
          none:req.body.none // None of the Above
        }
      );

      res.json(result);
    }
    else // new entry:
    {
      const label = new Label({
        user:req.user._id,
        document: req.body.documentId,
        mal:req.body.mal, // Machine Learning
        hdw:req.body.hdw, // Hardware
        evo:req.body.evo, // Evolution
        spc:req.body.spc, // speech
        vis:req.body.vis, // Vision
        nlp:req.body.nlp, // Natural Language Processing 
        pln:req.body.pln, // Planning 
        kpr:req.body.kpr, // Knowledge Processing
        none:req.body.none // None of the Above
      });

      res.json(await label.save());
    }
  }
  catch(error)
  {
    res.status(500).json({ error: error });
  }
});

router.get("/labels", async function (req, res, next) {
  try {
    const labels = await Label.find()
    res.json(labels);
  } catch (err) {
    res.json({ message: err });
  }
});

//Search for Patents by documentID + retrieve any annotations:
router.post("/search", async function (req, res, next) {
    let searchVal = req.body.patentSearchId

    const patent = await Patent.findOne({
      documentId: searchVal
    }).select("-_id");

    if(patent !== null)
    {
      const annotation = await Label.findOne({
        document: searchVal
      }).select("-_id");

      if(annotation !== null)
      {
        // only show patent annotations if they have been annotated by the current user:
        // OR if they are an admin, they can see the latest annotation: 
        if(annotation.user.toString() == req.user._id || req.user.role == "admin")
        {
          res.json([Object.assign(patent.toObject(), annotation.toObject())]);
        }
        else // show just the patent:
        {
          res.json([patent]);
        }
      }
      else
      {
        res.json([patent]);
      }
    }
    else 
    {
      res.json({message:`Patent with the given id \'${val}\' not found.`})
    }
});

// Remove a patent from the current user's queue:
router.post("/queue/remove", async function (req, res, next) {
  try {
    const queue = await Queue.find({ // fetch items from the queue for the current user.
      "userId":  req.user._id
    })
  
    if(queue.length !== 0) // user has a queue:
    {
      const newQueue = queue[0].items.filter(item => item !== req.body.documentId);
      
      await Queue.updateOne(
        { _id: queue[0]._id },
        { items: newQueue }
      );
  
      res.json(await getPatentQueue(req));
    }
    else // invalid request:
    {
      res.status(500).json({
        error: 'the current user does not have a queue',
      });
    }
  }
  catch(error)
  {
    res.status(500).json({ error: error });
  }
});

router.get("/getAllQueues", async function (req,res,next){

  const queues = await Queue.find({})

  if(queues.length < 1){
    res.status(500).json({error: "no queues are currently active"})
  }
  res.status(200).json([queues])
  


})

module.exports = router;
