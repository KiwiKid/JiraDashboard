import flow from 'lodash/fp/flow';
import uniqBy  from 'lodash/fp/uniqBy'
import groupBy from 'lodash/fp/groupBy';
import sumBy from "lodash/fp/sumBy";
import map from "lodash/fp/map";
import _ from 'lodash';


function getSprintFromIssue(issue, sprintId){

    var sprint;
    var futureSprint = issue.fields.closedSprints.find(s => s.id === sprintId);
    if(issue.fields.sprint && issue.fields.sprint.id === sprintId){
        sprint = issue.fields.sprint;
    }else if(futureSprint != null){
         sprint = futureSprint;
    }else{
     console.log('Sprint Not found for ID 1'+sprintId);
     throw new Exception('im a programmer...');
    }
    return sprint;
}

function getAllSubTaskIssueTypes(issues){
    return issues
    .filter(i => i.fields.issuetype.subtask)
    .map((i) => ({ 
        "key": i.key
        , "parent": i.fields.parent.key
        , "title": i.fields.summary
        , 
     }))
}
function getStoryIssueList(issues){
    return issues
    .filter(i => !i.fields.issuetype.subtask)
    .map((i) => ({ 
        "key": i.key
        , "title": i.fields.summary
        , "epic": i.fields.epic ? i.fields.epic.name : null
     }))

}


function getSubtaskEstimatesPerDay(allRawIssues, startDate, endDate){
    var sprintDatesArray = getDates(startDate, endDate)
    
    //// START DETAILED BURNDOWN
    var allEstimates = getAllEstimatesForSubtasks(allRawIssues);
}

function getAllEstimatesForSubtasks(issues) {

    // get all the time estimate in a big ol' array
    var allEstimates = [];
    issues.filter(i => i.fields.issuetype.subtask).forEach((subTask) => {
        subTask.changelog.histories.filter(h => h.items.some(i => i.field == 'timeestimate')).forEach(hi => {
            var estimateUpdateLog = hi.items.find(i => i.field == 'timeestimate');
            allEstimates.push({ 
                'date': new Date(hi.created)
                , 'key': subTask.key
                , 'keyType': subTask.key +'_' +subTask.fields.issuetype.name
                , 'parent': subTask.fields.parent.key
                , 'remaining': estimateUpdateLog.to });
        })
    });
    return allEstimates;
}

function getStoryEstimatesPerDay(allRawIssues, startDate, endDate){

    
    var sprintDatesArray = getDates(startDate, endDate)
    
    //// START DETAILED BURNDOWN
    var allEstimates = getAllEstimatesForSubtasks(allRawIssues);

    var dayEstimateByKeyPerDay = getLatestEstimateByKeyPerDay(getAllEstimatesBeforeEachDateByKey(allEstimates, sprintDatesArray));

    return dayEstimateByKeyPerDay;
}

function getAllEstimatesBeforeEachDateByKey(allEstimates, sprintDatesArray){
    var estimatesOnDates = [];
    sprintDatesArray.forEach(d => {
        estimatesOnDates.push({
            date: d
            , ...flow(
                groupBy("parent"),
            map((cat) => {
                cat['remaining'] = cat.reduce((prev, curr) => prev + curr.remaining, 0);
                return cat;
             }, {})
             // Only include estimates made before the current date we are processing
            )(allEstimates.filter(e => e.date < d )) 
        });
    });
    return estimatesOnDates;
}

function getLatestEstimateByKeyPerDay(estimatesOnDates){
    var dayEstimateByKeyPerDay = [];
    estimatesOnDates.forEach((d) => {
        var res = {};
        res['date'] = d.date.toISOString().substring(0,10);
        
        if(d.date < new Date()){
            // This is made a bit more complex by the groupBy format coming out of lodash
            // 
            //  estimatesOnDate: [ 
            //      date: 01/01/2001
            //      DEV-001: 7
            //      DEV-002: 3
            //  ] 
            Object.keys(d).filter(f => f != 'date').forEach((key) => {
                var totalRemainingEstimate = 0;
                
                _.uniqBy(d[key], 'key').forEach((subTask) => {
                    var latestEstimate = (d[key].filter(f => f.key == subTask.key).sort(f => f.date)[0].remaining / 3600)
                    totalRemainingEstimate += latestEstimate;

                });
                if(totalRemainingEstimate > 0){
                    // latest estimate
                    res[key] = totalRemainingEstimate;
                }
            });
            }
        dayEstimateByKeyPerDay.push(res);
    })
    return dayEstimateByKeyPerDay;
}

function getEpicColor(issue){
    var color = issue.fields.customfield_10016;
    switch(color){
        case "DEV-5610": return '#5243aa'
        case "DEV-5379": return '#00c7e6'
        case "DEV-5380": return '#4c9aff'
        case "DEV-5610": return '#998dd9'
    }
    return color || '#d3d3d3';
}

function getStatusColor(issue){
    var color = issue.fields.issuetype.subtask ? 
        issue.issue.fields.status.statusCategory.colorName :
        issue.fields.status.statusCategory.colorName;
    if(color == 'blue-gray'){
        return '#add8e6'
    }
    if(color == 'green'){
        return '#90ee90'
    }
    return color || '#d3d3d3 ';
}

var issueSortEpic = (function(a,b) {
    if(a.fields.customfield_10016 == b.fields.customfield_10016){
        return 0;
    }else if(a.fields.customfield_10016 > b.fields.customfield_10016){
        return 1;
    }else{
        return -1;
    }
});


function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(new Date (currentDate));
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

export { getEpicColor,getStatusColor, getSprintFromIssue, getStoryEstimatesPerDay, getDates, getAllSubTaskIssueTypes, getStoryIssueList, issueSortEpic}