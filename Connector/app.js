var express = require('express');
var MongoClient = require('mongodb').MongoClient;
const cors = require('cors'); // for dev only?
var url = "mongodb://localhost:27017/";
var serverPort = 9090;

var app = express();
var db = {};

app.use(cors());

app.get('/Data/:calmethod', function (req, res) {
    try
    {
        var ans = {};
        
        var calmethod = req.params.calmethod;
        var matchExpression = {};
        var groupDailyExpression = {};
        var groupExpression = {};
        var sortExpression = {"Timestamp":1};
        var dataCollection = db.collection("testRunData");
        var resolution = "day";
        groupExpression._id = {};
        groupDailyExpression._id = {};

        if (req.query.rangestart)
        {
            // date range query

            var rangeStart = new Date(req.query.rangeend + "T00:00:00Z");
            var rangeEnd = new Date(req.query.rangeend + "T00:00:00Z");

            // range with days specified 
            if (req.query.pastday)
            {
                var pastday = Number(req.query.pastday);
                rangeEnd.setUTCHours(0, 0, 0, 0);
                rangeStart.setUTCHours(0, 0, 0, 0);
                rangeStart.setUTCDate(rangeEnd.getUTCDate() - pastday);
            }
            else 
            {
                rangeStart = new Date(req.query.rangestart + "T00:00:00Z");
            }

            matchExpression.Timestamp = 
            {
                "$lte": rangeEnd,
                "$gte": rangeStart
            };
        } 
        else if (req.query.date)
        {
            // specific date query
            var chosenDate = new Date(req.query.date + "T00:00:00Z");
            var chosenDateEnd = new Date(req.query.date + "T00:00:00Z");
            chosenDate.setUTCHours(0, 0, 0, 0);
            chosenDateEnd.setUTCHours(0, 0, 0, 0);
            chosenDateEnd.setUTCDate(chosenDate.getUTCDate() + 1);
            matchExpression.Timestamp = 
            {
                "$gte": chosenDate,
                "$lt": chosenDateEnd
            };
        }

        // set query resolution as requested
        if (req.query.resolution)
        {
            resolution = req.query.resolution;
        } 

        groupDailyExpression._id =
        {
            Timestamp: "$Timestamp",
            day: {$dayOfMonth: "$Timestamp"},
            month: {$month: "$Timestamp"},
            year: {$year: "$Timestamp"},
        }
        groupDailyExpression.totalValue = {$sum: "$Value"};
        groupExpression.Timestamp = {$max: "$_id.Timestamp"};

        switch (resolution)
        {
            case "day":
                groupExpression._id.day = "$_id.day";
            case "month":
                groupExpression._id.month = "$_id.month";
            case "year":
                groupExpression._id.year = "$_id.year";
            default: break;
        }

        if (calmethod === "avg")
        {
            groupExpression.runtime = {$avg: "$totalValue"};
        } else if (calmethod === "max")
        {
            groupExpression.runtime = {$max: "$totalValue"};
        } else if (calmethod === "min")
        {
            groupExpression.runtime = {$min: "$totalValue"};
        }

        dataCollection.aggregate(
            [
                {$match: matchExpression},
                {$group: groupDailyExpression},
                {$group: groupExpression},
                {$sort: sortExpression}
            ]).toArray(function(err, data)
            {
                if (err) 
                    throw err;
                else
                {
                    ans = 
                    {
                        error: null,
                        result : data
                    };
                }
                res.send(ans);
            });
    }
    catch (error)
    {
        res.send(
            {
                error: "error",
                message: error.message
            });
    }
});

MongoClient.connect((url), (err, _db) => {
    if (err)
    {
        console.log(err);
    } else {
        db = _db.db("testRun");
        console.log("Connected to MongoDB.");
        app.listen(serverPort, () => {
            console.log("DataConnector back-end listening at %s", serverPort);
        });
    }
});