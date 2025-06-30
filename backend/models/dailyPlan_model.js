const mongoose = require('mongoose')

const DailyPlanSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date:{
        type: Date,
        required: true,
    },
    tasks: [{
        subject: {
            type: String,
            required: true,
        },
        topic: {
            type: String,
            required: true,
        },
        completed: {
            type: Boolean,
            default: false,//so user doesn't need to set on craetion
        },
    }],
}, {
    timestamps: true,
})

module.exports = mongoose.model('DailyPlan',DailyPlanSchema);