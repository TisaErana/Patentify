const { Schema, model } = require("mongoose");

const agreedLabelsSchema = new Schema(
    {
        document:{ type:String, index: {unique: true, dropDups: true} },
        individual: [ 
            {
                user:{ type: Schema.Types.ObjectId, ref: "User"},
                mal:{type:String},
                hdw:{type:String},
                evo:{type:String},
                spc:{type:String},
                vis:{type:String},
                nlp:{type:String},
                pln:{type:String},
                kpr:{type:String}
            },
            {
                user:{ type: Schema.Types.ObjectId, ref: "User"},
                mal:{type:String},
                hdw:{type:String},
                evo:{type:String},
                spc:{type:String},
                vis:{type:String},
                nlp:{type:String},
                pln:{type:String},
                kpr:{type:String}
            }
         ],
        consensus: {
            mal:{type:String},
            hdw:{type:String},
            evo:{type:String},
            spc:{type:String},
            vis:{type:String},
            nlp:{type:String},
            pln:{type:String},
            kpr:{type:String}
        }
    }, 
    {
        timestamps: true
    }
);

module.exports = model("agreed_labels", agreedLabelsSchema);
