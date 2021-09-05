const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {
    ObjectId
} = require('mongodb')
const {
    check,
    validationResult
} = require('express-validator');

const User = require('../../models/User');
const Assignment = require('../../models/assignment');
const Submission = require('../../models/submission');
const Teacher = require("../../models/teacher");

router.post('/add', auth, async (req, res) => {
    try {
        const teacherlogin = await Teacher.findById(req.user.id)
        if (!teacherlogin) {
            res.status(400).send('Invalid Id for Teacher');
            return
        }

        const assignmentAlreadyPresent = await Assignment.findOne({
            "name": req.body.name
        })
        if (assignmentAlreadyPresent) {
            res.status(400).send("Assignment is already present")
            return
        }
        const submissiondetail = {}
        const assignmentObj = {}
        assignmentObj.name = req.body.name
        assignmentObj.status = req.body.status
        assignmentObj.deadline = req.body.deadline
        assignmentObj.students = req.body.students
        if (req.body.description) assignmentObj.description = req.body.description
        if (req.body.publishAt) assignmentObj.publishAt = req.body.publishAt

        const newAssignmet = new Assignment(assignmentObj);
        await newAssignmet.save();
        submissiondetail.assignment = newAssignmet._id

        const teacherAssinment = await Teacher.updateOne({
            _id: req.user.id
        }, {
            $addToSet: {
                "assignments": newAssignmet._id
            }
        })
        submissiondetail.teacher = req.user.id


        var user = await User.find({
            email: req.body.students
        })
        console.log(user)
        if (user) {
            for (let i = 0; i < user.length; i++) {
                const userid = user[i]._id;
                const updatedAssignment = await User.updateOne({
                    _id: userid
                }, {
                    $addToSet: {
                        assignments: newAssignmet._id,
                    },
                });
                submissiondetail.user = userid
                const submissionadded = new Submission(submissiondetail)
                await submissionadded.save()
            }
            const allsubmission = Submission.find()
        } else {
            res.status(400).send("user not exist")
        }

        res.json({
            newAssignmet,
            teacherAssinment,
            user
        });


    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
})

router.post('/delete/:assignment_name', auth, async (req, res) => {
    try {
        const teacherlogin = await Teacher.findById(req.user.id)
        if (!teacherlogin) {
            res.status(400).send('Invalid Id for Teacher');
            return
        }

        const assignmentAlreadyPresent = await Assignment.findOne({
            name: req.params.assignment_name
        })
        if (!assignmentAlreadyPresent) {
            res.status(400).send("Assignment is not present")
            return
        } else {
            const sd1 = await Submission.deleteMany({
                assignment: assignmentAlreadyPresent._id
            })

            const t1 = await Teacher.findOneAndUpdate({
                _id: req.user.id
            }, {
                $pull: {
                    assignments: assignmentAlreadyPresent._id
                }
            })

            for (let i = 0; i < assignmentAlreadyPresent.students.length; i++) {
                const s1 = await User.findOneAndUpdate({
                    email: assignmentAlreadyPresent.students[i]
                }, {
                    $pull: {
                        assignments: assignmentAlreadyPresent._id,
                        completedAssignments: assignmentAlreadyPresent._id
                    }
                })
            }


            Assignment.findOneAndRemove({
                _id: assignmentAlreadyPresent._id
            }, (error) => {
                if (error) {
                    console.log(error.message)
                }
            })
        }

        res.json('Successfully deleted');

    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
})

router.post('/update/:assignment_name', auth, async (req, res) => {
    try {
        const teacherlogin = await Teacher.findById(req.user.id)
        if (!teacherlogin) {
            res.status(400).send('Invalid Id for Teacher');
        }

        const assignmentAlreadyPresent = await Assignment.findOne({
            name: req.params.assignment_name
        })
        if (!assignmentAlreadyPresent) {
            res.status(400).send("Assignment is not present")
            return
        } else {
            const assignmentObj = {}
            assignmentObj.name = req.body.name
            assignmentObj.status = req.body.status
            assignmentObj.deadline = req.body.deadline
            assignmentObj.students = req.body.students
            if (req.body.description) assignmentObj.description = req.body.description
            if (req.body.publishAt) assignmentObj.publishAt = req.body.publishAt

            const assignmentUpdate = Assignment.findOneAndUpdate({
                name: req.params.assignment_name
            }, {
                $set: assignmentObj
            }, (err) => {
                if (err) {
                    console.log(err.message)
                }
            })
            res.json('Successfully Updated');
        }



    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
})

router.post('/submit/:assignment_name', auth, async (req, res) => {
    try {
        const studentlogin = await User.findById(req.user.id)
        if (!studentlogin) {
            res.status(400).send('Invalid Id for Student');
        }
        const selectedAssignment = await Assignment.findOne({
            name: req.params.assignment_name
        })
        if (!selectedAssignment) {
            res.status(400).send("Assignment is not present")
            return
        }

        const completedAssignment = await User.find({
            $and: [{
                _id: req.user.id
            }, {
                completedAssignments: selectedAssignment._id
            }]
        })
        if (completedAssignment) {
            res.status(400).send("You have already submitted this assignment")
            return
        }

        const submittedAssignment = await User.find({
            $and: [{
                _id: req.user.id
            }, {
                assignments: selectedAssignment._id
            }]
        })

        if (!submittedAssignment) {
            res.status(400).send("No assignment of this name alloted to you")
            return
        } else {
            let statusT = ""
            if (Date.now > selectedAssignment.deadline) {
                statusT = "OVERDUE"
            } else {
                statusT = "SUBMITTED"
            }

            const submitted = await User.findOneAndUpdate({
                _id: req.user.id
            }, {
                $addToSet: {
                    completedAssignments: selectedAssignment._id
                }
            })

            const submissionlist = Submission.updateMany({
                $and: [{
                    user: req.user.id
                }, {
                    assignment: selectedAssignment._id
                }]
            }, {
                $set: {
                    submission: req.body.submission,
                    submittedOn: Date.now(),
                    status: statusT,
                }
            }, {
                upsert: true
            }, (err) => {
                if (err) {
                    console.log(err.message)
                }
            })

            res.send({
                submitted
            })
            return

        }
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
})

router.get('/list', auth, async (req, res) => {
    try {
        const isStudent = await User.findById(req.user.id)
        const isTeacher = await Teacher.findById(req.user.id)
        if (isStudent) {
            const list = await Submission.find({
                user: req.user.id
            })
            if (req.query.publishedAt) {
                const userdetail = await User.findById(req.user.id)
                let assignmentlist = await Assignment.find({
                    $and: [{
                        status: req.query.publishedAt
                    }, {
                        students: userdetail.email
                    }]
                }).select(['_id'])
                assignmentlist = assignmentlist.map((item) => {
                    return item._id
                })
                const listfinal = await Submission.find({
                    $and: [{
                        assignment: {
                            $in: assignmentlist
                        }
                    }, {
                        user: req.user.id
                    }]
                })
                res.send(listfinal)
                return
            }
            if (req.query.status) {
                const assignmentlistStatus = await Submission.find({
                    $and: [{
                        status: req.query.status
                    }, {
                        usesr: req.user.id
                    }]
                })
                res.send(assignmentlistStatus)
                return
            }
            res.send(list)
        } else if (isTeacher) {
            const list = await Submission.find({
                teacher: req.user.id
            })
            if (req.query.publishedAt) {
                const teacherdetail = await Teacher.findById(req.user.id)
                let assignmentlist = await Assignment.find({
                    $and: [{
                        status: req.query.publishedAt
                    }, {
                        _id: teacherdetail.assignments
                    }]
                }).select(['_id'])
                assignmentlist = assignmentlist.map((item) => {
                    return item._id
                })
                const listfinal = await Submission.find({
                    assignment: {
                        $in: assignmentlist
                    }
                })
                res.send(listfinal)
                return
            }
            res.send(list)
        } else {
            res.status(400).send('Invalid Id');
            return
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Server error');
    }
})




module.exports = router;