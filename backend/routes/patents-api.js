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

/**
 * GETs patents from the database.
 * IF the user has items in their queue:
 *    the entire queue will be retrieved.
 *    the first patent will be loaded.
 * ELSE
 *    the user will recieve a random patent.
*/
router.get("/", async function (req, res, next) {
  try {
    const queue = await Queue.find({ // fetch items from the queue for the current user.
      "userId":  req.user._id
    })

    if (queue.length !== 0 && queue[0].items.length > 0) // a single user should not have more than one queue.
    {
      const first_patent = await Patent.find({ // find the patent corpus.
          documentId: queue[0].items[0]
      });

      res.json((first_patent.length != 0) ?
        [first_patent[0], queue[0].items] :
        { error: 'patent with id ' + queue[0].items[0] + ", in queue at [0] is not in database."}
      );
    }
    else // current user has no queued items:
    {
      console.log("current user does not have a queue, sending random patent")
      const random_patent = await Patent.aggregate([{ $sample: { size: 1 } }]); // returns a random document from MongoDB
      res.json([random_patent[0], []]);
    }
  } catch (err) {
    res.json({ message: err });
  }
});

/**
 * POSTs the queue index to fetch instead of just the first patent in queue.
 */
router.post("/", async function (req, res, next) {
  try {  
    const queue = await Queue.find({ // fetch items from the queue for the current user.
      "userId":  req.user._id
    })

    if (queue.length !== 0 && queue[0].items.length > 0) // a single user should not have more than one queue.
    {
      if (req.body.queueIndex < 0) { res.json({ message: "invalid index" }) }

      const patent = await Patent.find({ // find the patent corpus.
          documentId: queue[0].items[req.body.queueIndex]
      });

      res.json((patent.length != 0) ?
        [patent[0], queue[0].items] :
        { error: 'patent with id ' + queue[0].items[0] + ", in queue at ["+req.body.queueIndex+"] is not in database."}
      );
    }
    else // current user has no queued items:
    {
      res.json({ message: "the current user does not have a queue" });
    }
  } catch (err) {
    res.json({ message: err });
  }
});

// This route is sending a post to the DB with labeling information aswell as documentid and userid
router.post("/labels", async function (req, res, next) {
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
  });
  label
    .save()
    .then((result) => {
      // console.log(result);
      res.status(201).json(result);
    })
    .catch((error) => {
      // console.log(error);
      res.status(500).json({
        error: error,
      });
    });
});

router.get("/labels", async function (req, res, next) {
  try {
    const labels = await Label.find()
    res.json(labels);
  } catch (err) {
    res.json({ message: err });
  }
});

//Search for Patents by documentID
router.post("/search", async function (req, res, next) {
    let val = req.body.patentId
 
    mongoose.connection.db.collection("patents", function(err,collection){
      collection.find({"documentId": val}).toArray(function(err,data){  
        if(data.length > 0 ){
          res.json(data)
        }else{
          res.json({message:`Patent with the given id \'${val}\' not found.`})
        }
      })
    });

    // DOESN'T WORK FOR SOME REASON
    // const patent = await Label.find({document:val}).exec()
    // console.log(patent)
    // res.json(patent)
});

module.exports = router;
