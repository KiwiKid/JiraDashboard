import React, {useState, useEffect} from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import flow from 'lodash/fp/flow';
import groupBy from 'lodash/fp/groupBy';
import sumBy from "lodash/fp/sumBy";
import map from "lodash/fp/map";
import _ from 'lodash';

import { getDates } from '../utils/jiraUtils.js'

function SubTaskRemainigEstimate(props){

    const[graphInput, setGraphInput] = useState(null);
    const[issueTypes, setIssueTypes] = useState(null);

    useEffect(() => {
        var res = process(props.rawData, parseInt(props.sprintId));
        setGraphInput(res.graphInput);
        setIssueTypes(res.issueTypes);
     }, [props.sprintId]);

    return(
        <div>
          <h1>{props.sprintId}</h1>
        <AreaChart
            width={1700}
            height={800}
            data={graphInput}
            margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis type="number" domain={[50,100,150,200]}/>
            <Tooltip />
            <Legend />
            {issueTypes == null ? null : issueTypes.map((it) => {
                return <Area type="monotone" dataKey={it.key} stackId="1" stroke={it.type == "TEST" ? "#8884d8" : "#84d888"} fill={it.type == "TEST" ? "#8884d8" : "84d888"} />
            })};
        </AreaChart>
        </div>
        )
    }

    export default SubTaskRemainigEstimate





// Time Remaining

function process(rawSprint, sprintId){
           var dates = [];
           var graphInput = [];
           var issueTypes;

               // get all the time estimate in a big ol' array
               var allEstimates = [];
               rawSprint.issues.forEach((issue) => {
                   issue.changelog.histories.filter(h => h.items.some(i => i.field == 'timeestimate')).forEach(hi => {
                       var estimateUpdateLog = hi.items.find(i => i.field == 'timeestimate');
                       allEstimates.push({ 'date': new Date(hi.created), 'key': issue.key, 'type': issue.fields.issuetype.name, 'remaining': estimateUpdateLog.to });
                   })
               });
               
               var sprint;
               var futureSprint = rawSprint.issues[0].fields.closedSprints.find(s => s.id === sprintId);
               if(rawSprint.issues[0].fields.sprint && rawSprint.issues[0].fields.sprint.id === sprintId){
                   sprint = rawSprint.issues[0].fields.sprint;
               }else if(futureSprint != null){
                    sprint = futureSprint;
               }else{
                console.log('Sprint Not found for ID 1'+sprintId);
                throw new Exception('im a programmer...');
               }
               // The issue must have been in the current or previous sprint.                
               if(!!sprint || sprint == undefined){
                   console.log(sprint);
                   console.log(typeof(sprint));
                //throw new {'im a programmer too...'};
               }
               var sprintDates = getDates(new Date(sprint.startDate), new Date(sprint.endDate));


               issueTypes = rawSprint.issues.map((i) => ({ "key": i.key, "type": i.fields.issuetype.name, "title": i.fields.summary }));
               
               //// START DETAILED BURNDOWN
                var estimatesOnDates = [];
               sprintDates.forEach(d => {
                   estimatesOnDates.push({
                       date: d
                       , ...flow(
                           groupBy("key"),
                       map((cat) => {
                           cat['remainingTime'] = curr.remaining;
                           cat['type'] = curr.type;
                           return cat;
                        }, {}) // i want to get the to estiamte of the latest date
                        // minus two days to include estimates made before the sprints starts
                       )(allEstimates.filter(e => e.date < d && e.date > new Date(sprint.startDate).addDays(-2))) // Only include estimates made before this date 
                   });
               });
               
               estimatesOnDates.forEach((d) => {
                   var res = {};
                   res['date'] = d.date.toISOString().substring(0,10);
                   
                   if(d.date < new Date()){
                       // Set the latest remaining date estimate
                       Object.keys(d).filter(f => f != 'date').forEach((key) => {
                           var latestEstimate = (d[key].sort(f => f.date)[0].remaining / 3600);
                           var firstFutureEstimate = (allEstimates.filter(e => e.key == key).sort(e => e.date)[0].remaining / 3600);
                           if(latestEstimate > 0){
                               // latest estimate
                               res[key] = latestEstimate;
                           }else if(firstFutureEstimate > 0){
                               res[key] = firstFutureEstimate;
                           }
                       });
                   }
                   graphInput.push(res);
               })

               //// END DETAILED BURNDOWN

               //create a graph with just the types
              //     list all the issues
               //    create a graph with just the parent issue keys
return { 'issueTypes': issueTypes, 'graphInput': graphInput };
}

