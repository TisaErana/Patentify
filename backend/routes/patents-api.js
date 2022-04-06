const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const db = mongoose.connection.db
// This is the model of the patents
const Patent = require("../models/patent_model");

// Import label model
const Label = require("../models/label_model");
const AgreedLabel = require("../models/agreed_labels_model");
const DisagreedLabel = require("../models/disagreed_labels_model");

// Import queue model
const Queue = require("../models/queue_model");
const e = require("express");
const { rawListeners } = require("../app");
const disagreed_labels_model = require("../models/disagreed_labels_model");

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
      queueItem.title =  patent.title,
      queueItem.abstract = patent.abstract,
      queueItem.claims = patent.claims,
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
      title: patent.title,
      claims: patent.claims,
      abstract: patent.abstract,
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

/**
 * ADDs or UPDATEs an annotation in the database.
 * 
 * @returns the newly added or updated annotation from the database.  
*/
router.post("/labels", async function (req, res, next) { 
  
  // find annotation in labels (diff. category) (should only be one entry / document / user):
  const annotation = await Label.findOne({
    document: req.body.documentId
  }).catch((error) => {
    res.status(500).json({ error: error });
  });
  
  // check if there is already an annotation in the database:
  if(annotation !== null) // let's update it:
  {
    // check if same user is updating their own annotation (via search):
    if(annotation.user === req.user._id)
    {
      const result = await Label.updateOne(
        { _id: annotation._id },
        {
          mal:req.body.mal, // Machine Learning
          hdw:req.body.hdw, // Hardware
          evo:req.body.evo, // Evolution
          spc:req.body.spc, // Speech
          vis:req.body.vis, // Vision
          nlp:req.body.nlp, // Natural Language Processing 
          pln:req.body.pln, // Planning 
          kpr:req.body.kpr // Knowledge Processing
        }
      ).catch((error) => {
        res.status(500).json({ error: error });
      });

      res.json(result);
    }
    else // check if the annotations agree or disagree with each other:
    {
      // map new annotation values to true or false for each category:
      newAnnotation = [
        req.body.mal === "Yes",
        req.body.hdw === "Yes",
        req.body.evo === "Yes",
        req.body.spc === "Yes", 
        req.body.vis === "Yes", 
        req.body.nlp === "Yes", 
        req.body.pln === "Yes", 
        req.body.kpr === "Yes"
      ]

      // map stored annotation values to true or false for each category:
      storedAnnotation = [
        annotation.mal === "Yes",
        annotation.hdw === "Yes",
        annotation.evo === "Yes",
        annotation.spc === "Yes",
        annotation.vis === "Yes",
        annotation.nlp === "Yes",
        annotation.pln === "Yes",
        annotation.kpr === "Yes"
      ]

      // determine if annotations think document is AI or not AI: 
      newIsAI = newAnnotation.some(category => category === true);
      storedIsAI = storedAnnotation.some(category => category === true);

      // find consensus amongst annotations:
      if (newIsAI == storedIsAI)
      {
         const agreedLabel = new AgreedLabel({
           document: req.body.documentId,
           individual: [
             {
               user: req.user._id, // new annotation by current user
               mal: req.body.mal,
               hdw: req.body.hdw,
               evo: req.body.evo,
               spc: req.body.spc,
               vis: req.body.vis,
               nlp: req.body.nlp,
               pln: req.body.pln,
               kpr: req.body.kpr
             },
             {
               user: annotation.user, // stored annotation by another user
               mal: annotation.mal,
               hdw: annotation.hdw,
               evo: annotation.evo,
               spc: annotation.spc,
               vis: annotation.vis,
               nlp: annotation.nlp,
               pln: annotation.pln,
               kpr: annotation.kpr
             }
           ],
           consensus: {
             mal: (newAnnotation[0] ? "Yes" : annotation.mal),
             hdw: (newAnnotation[1] ? "Yes" : annotation.hdw),
             evo: (newAnnotation[2] ? "Yes" : annotation.evo),
             spc: (newAnnotation[3] ? "Yes" : annotation.spc),
             vis: (newAnnotation[4] ? "Yes" : annotation.vis),
             nlp: (newAnnotation[5] ? "Yes" : annotation.nlp),
             pln: (newAnnotation[6] ? "Yes" : annotation.pln),
             kpr: (newAnnotation[7] ? "Yes" : annotation.kpr)
           }
         });

        annotation.deleteOne();

        res.json(await agreedLabel.save().catch((error) => {
           res.status(500).json({ error: error });
        }));
      }
      else // they disagree, let's store them for a 3rd party to decide:
      {
        const disagreedLabel = new DisagreedLabel({
          document: req.body.documentId,
          disagreement: [
            {
              user: req.user._id,
              mal:req.body.mal,
              hdw:req.body.hdw,
              evo:req.body.evo, 
              spc:req.body.spc, 
              vis:req.body.vis,
              nlp:req.body.nlp, 
              pln:req.body.pln,  
              kpr:req.body.kpr
            },
            {
              user: annotation.user,
              mal:annotation.mal,
              hdw:annotation.hdw,
              evo:annotation.evo, 
              spc:annotation.spc,
              vis:annotation.vis,
              nlp:annotation.nlp,
              pln:annotation.pln,
              kpr:annotation.kpr
            }
          ]
        });

      annotation.deleteOne();
       
      res.json(await disagreedLabel.save().catch((error) => {
         res.status(500).json({ error: error });
       }));
      }

    }
  }
  else // new entry:
  {
    const label = new Label({
      user:req.user._id,
      document: req.body.documentId,
      mal:req.body.mal, // Machine Learning
      hdw:req.body.hdw, // Hardware
      evo:req.body.evo, // Evolution
      spc:req.body.spc, // Speech
      vis:req.body.vis, // Vision
      nlp:req.body.nlp, // Natural Language Processing 
      pln:req.body.pln, // Planning 
      kpr:req.body.kpr, // Knowledge Processing
    });

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
      res.json(Object.assign(patent.toObject(), annotation.toObject()));
    }
    else
    {
      res.json(patent);
    }
  }
  else 
  {
    res.json({message:`Patent with the given id \'${searchVal}\' not found.`})
  }
});

// Remove a patent from the current user's queue:
router.post("/queue/remove", async function (req, res, next) {
res.json(
  await getNextPatent(req, {"mode": "update", "documentId": req.body.documentId}).catch((error) => {
    res.status(400).json({ error: error });
}));
});

// clears the cookie on the backend side:
router.get('/logout', function (req, res) {
  req.logOut();
  res.status(200).json({ status: "unauthenticated"});
});

/** **************************************************************************************************************************************
 * Restricted Access: 
 * any routes declared after this point will require 'admin' role.
 * to make public routes, declare the specific routes before this router.use(..) statement.
 * ***************************************************************************************************************************************/
router.use((req, res, next) => {
  if(req.user.role === 'admin') { next(); }
  else { 
    console.log('[Unauthorized]:', req.user.email, '<', req.user._id, '> attempted to access', req.originalUrl)
    res.status(401).json({ error: 'unauthorized' });
  }
});

/**
 * GETs all annotated data for the admin.
 */
router.get("/labels", async function (req, res, next) {
  res.json(
    { 
      labels: await Label.find().catch((error) => {
        res.status(500).json({ error: error });
      }),
      agreedLabels: await AgreedLabel.find().catch((error) => {
        res.status(500).json({ error: error });
      }),
      disagreedLabels: await DisagreedLabel.find().catch((error) => {
        res.status(500).json({ error: error });
      })
    });
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

router.get("/chart", async function (req, res, next) {
 
  unique = await Label.count();
  agreed = await AgreedLabel.count();
  disagreed = await DisagreedLabel.count();

  total = unique + agreed + disagreed;

  ml = await Label.countDocuments({mal:{$eq:"Yes"}});
  mlAgreed = await AgreedLabel.countDocuments({mal:{$eq:"Yes"}});
  ml += mlAgreed;

  hard = await Label.countDocuments({hdw:{$eq:"Yes"}});
  hardAgreed = await AgreedLabel.countDocuments({hdw:{$eq:"Yes"}});
  hard += hardAgreed;

  evol = await Label.countDocuments({evo:{$eq:"Yes"}});
  evolAgreed = await AgreedLabel.countDocuments({evo:{$eq:"Yes"}});
  evol += evolAgreed;

  spee = await Label.countDocuments({spc:{$eq:"Yes"}});
  speeAgreed = await AgreedLabel.countDocuments({spc:{$eq:"Yes"}});
  spee += speeAgreed;

  vision = await Label.countDocuments({vis:{$eq:"Yes"}});
  visionAgreed = await AgreedLabel.countDocuments({vis:{$eq:"Yes"}});
  vision += visionAgreed;

  natural = await Label.countDocuments({nlp:{$eq:"Yes"}});
  naturalAgreed = await AgreedLabel.countDocuments({nlp:{$eq:"Yes"}});
  natural += naturalAgreed;

  plan = await Label.countDocuments({pln:{$eq:"Yes"}});
  planAgreed = await AgreedLabel.countDocuments({pln:{$eq:"Yes"}});
  plan += planAgreed;

  know = await Label.countDocuments({kpr:{$eq:"Yes"}});
  knowAgreed = await AgreedLabel.countDocuments({kpr:{$eq:"Yes"}});
  know += knowAgreed

  res.status(200).json({total: total, unique: unique, agreed: agreed, disagreed: disagreed, ml: ml, hard: hard, evol: evol, spee: spee, vision: vision, natural: natural, plan: plan, know: know});
})

module.exports = router;
