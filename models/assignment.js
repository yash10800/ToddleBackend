const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AssignmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description:{
      type:String,
      required:true
    },
    status:{
      type:String
    },
    publishAt:{
      type:Date,
      default:Date.now()
    },
    deadline:{
      type:Date,
      required:true
    },
    students:[{
      type:String,
    
    }]

  },
  {
    timestamps: true,
  }
);

const Assignment = mongoose.model('Assignment', AssignmentSchema);

module.exports = Assignment;
