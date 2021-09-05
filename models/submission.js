const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SubmissionSchema = new Schema(
  {
    assignment:{
        type:mongoose.Schema.Types.ObjectID,
        ref:'Assignment',
        required:true
    },
    teacher:{
        type:mongoose.Schema.Types.ObjectID,
        ref:'Teacher',
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectID,
        ref:'User',
        required:true
    },
    submission:{
        type:String,
        default:''
    },
    submittedOn:{
        type:Date,
        default:''
    },
    status:{
        type:String,
        default:"PENDING"
    }

  },
  {
    timestamps: true,
  }
);

const Submission = mongoose.model('Submission', SubmissionSchema);

module.exports = Submission;
