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
const { rawListeners } = require("../app");

// Backend Constants:

/**
 * The sample size of random patents to retrieve from the DB when findind a new patent.
 * 
 * Increase this when most patents in the DB have been labeled/are in queues to be labeled to decrease DB queries.
 * Decrease this when size of patents in DB > size of patents labeled/in user queues.
 */
const QUEUE_CANDIDATE_LOOKUP_SIZE = 3;

/**
 * Finds the next best patent to show the user.
 * @param {*} req the api request to the server.
 * @param {Object} transaction update existing entry or make a new one.
 *    transaction: 
 *      mode: new | update
 *      documentId: the documentId of the patent currently in the queue.
 * @return an Object with patent information.
 */
async function getNextPatent(req, transaction = { "mode": "new", "documentId": undefined }) {
  // find patents the user has already labeled:
  var alreadyLabeled = await Label.find({
    user: req.user._id
  }).select(['-_id', 'document']).distinct('document');

  // find patents in someone else's queue:
  var inQueues = await Queue.find({
    userId: req.user._id
  }).select(['-_id', 'documentId']).distinct('documentId')
  
  var candidates = await Patent.aggregate([
    { $sample: { size: QUEUE_CANDIDATE_LOOKUP_SIZE } }
  ]); // find some random patent candidates

  var i = 0; // current index
  var patent = candidates[i]; // current patent
  const patentIdsToExclude = alreadyLabeled.concat(inQueues);

  // this is a lot faster than excluding them in the MongoDB aggregate function:
  while(patentIdsToExclude.includes(patent.documentId))
  {
    if(i == (QUEUE_CANDIDATE_LOOKUP_SIZE - 1)) {
      candidates = await Patent.aggregate([
        { $sample: { size: QUEUE_CANDIDATE_LOOKUP_SIZE } }
      ]); // find some random patent candidates

      i = 0;
    }
    patent = candidates[++i];
  }
  
  if(transaction.mode === "update")
  {
    const queueItem = await Queue.findOne({
      userId: req.user._id,
      documentId: transaction.documentId
    })
    .catch((error) => {
      throw error;
    });

    if(queueItem !== null)
    {
      queueItem.documentId = patent.documentId;
      queueItem.patentCorpus = patent.patentCorpus;
      queueItem.updatedAt = Date.now();

      await queueItem.save().catch((error) => {
        throw error;
      });
    }
    else { 
      throw "invalid queue: check user and documentId"; 
    }
  }
  else
  {
    await (new Queue({
      userId: req.user._id,
      documentId: patent.documentId,
      patentCorpus: patent.patentCorpus
    }))
    .save()
    .catch((error) => {
      console.log(error);
    });
  }

  return patent;
}

/**
 * GETs patents from the database.
 * 
 * IF the user has items in the queue:
 *    that item will be retrieved.
 * ELSE
 *    a new patent will be found for them and added to the queue.
 * 
 * @returns json encoded patent information.   
*/
router.get("/", async function (req, res, next) {
  const userQueue = await Queue.findOne({
    "userId":  req.user._id
  });

  // there is a patent in queue for the current user:
  if(userQueue !== null)
  {
    userQueue.updatedAt = Date.now();
    
    await userQueue.save().catch((error) => {
      res.status(500);
    });

    res.json(userQueue);
  }
  else // let's find a new patent for the user:
  {
    res.json(
      await getNextPatent(req).catch((error) => {
        res.status(500).json({ error: error });
    }));
  }

});

// This route is sending a post to the DB with labeling information aswell as documentid and userid
router.post("/labels", async function (req, res, next) { 
  const annotation = await Label.findOne({
    user: req.user._id,
    document: req.body.documentId
  }).catch((error) => {
    res.status(500).json({ error: error });
  });
  
  // check if there is already an annotation in the database by the current user:
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
    ).catch((error) => {
      res.status(500).json({ error: error });
    });

    await getNextPatent(req, 
      {
        "mode": "update", 
        "documentId": req.body.documentId
      }).catch((error) => {
        res.status(400).json({ error: error })
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

    await getNextPatent(req, 
      {
        "mode": "update", 
        "documentId": req.body.documentId
      }).catch((error) => {
        res.status(400).json({ error: error })
      }
    );

    res.json(await label.save().catch((error) => {
      res.status(500).json({ error: error });
    }));
  }

});

/**
 * Checks if the user is authenticated in the backed:
 * if not, it will prompt the frontend to sync and have the user log in again.
 */
router.get('/status', function (req, res) {
  if(req.user)
  {
    res.status(200).json({ status: "authenticated"});
  }
  else
  {
    res.status(200).json({ status: "unauthenticated"});
  }
});

router.get("/labels", async function (req, res, next) {
  res.json(await Label.find().catch((error) => {
    res.status(500).json({ error: error });
  }));
});

//Search for Patents by documentID + retrieve any annotations:
router.post("/search", async function (req, res, next) {
    let searchVal = req.body.patentSearchId

    const patent = await Patent.findOne({
      documentId: searchVal
    }).select("-_id");

    if(patent !== null)
    {
      // find annotation done by current user:
      const annotation = await Label.findOne({
        user: req.user._id,
        document: searchVal
      }).select("-_id");

      if(annotation !== null)
      {
        res.json([Object.assign(patent.toObject(), annotation.toObject())]);
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
  res.json(
    await getNextPatent(req, {"mode": "update", "documentId": req.body.documentId}).catch((error) => {
      res.status(400).json({ error: error });
  }));
});

router.get("/getAllQueues", async function (req,res,next){

  if(req.user.role === 'admin')
  {
    const queues = await Queue.find().catch((error) => {
      console.log(error);
      res.status(500);
    });
    res.status(200).json(queues);
  }
  else
  {
    res.status(401).json({ error: "unauthorized" });
  }
})

// clears the cookie on the backend side:
router.get('/logout', function (req, res) {
  req.logOut();
  res.status(200).json({ status: "unauthenticated"});
});

module.exports = router;
