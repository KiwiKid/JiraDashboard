import React, {useState, useEffect} from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import flow from 'lodash/fp/flow';
import groupBy from 'lodash/fp/groupBy';
import sumBy from "lodash/fp/sumBy";
import map from "lodash/fp/map";
import _ from 'lodash';

import { getStoryEstimatesPerDay, getStoryIssueList, issueSortEpic } from '../utils/jiraUtils.js'

const toPercent = (decimal, fixed = 0) => `${(decimal * 100).toFixed(fixed)}%`;

const getPercent = (value, total) => {
    const ratio = total > 0 ? value / total : 0;
  
    return toPercent(ratio, 2);
  };  

function StoryRemainingEstimate(props){

    const[graphInput, setGraphInput] = useState(null);
    const[issueTypes, setIssueTypes] = useState(null);
    
    function getTicketInfo(key){
        if(stories != null){
            return stories.find(f => f.key == key);
        }
    }

    function getColor(ticket){
        if(!ticket.fields.customfield_10016){
            return 'grey'
        }
        switch(ticket.fields.customfield_10016){
            case 'DEV-5380': return 'blue'
            case 'DEV-5378': return 'purple'
            case 'DEV-5379': return 'teal'
            default: 
                return 'green'
        }
    }

    const renderTooltipContent = (o) => {
        const { payload, label } = o;
    
        const total = payload.reduce((result, entry) => result + entry.value, 0);
    
        const res = payload.map((payload) => {
            var ticket = getTicketInfo(payload.dataKey);
            var color = getColor(ticket);
            return {     
                'summary': ticket.fields.summary
                , 'epicKey': ticket.fields.customfield_10016
                , 'color': color
                ,...payload
                , 'ticket': ticket
            };
        }).sort((a,b) => issueSortEpic(a.ticket, b.ticket));
    
       // console.log('$$$$$$$$$$$$$$$$$$$$$$$$'+JSON.stringify(payload)+'$$$$$$$$$$$$$$$$$$$$$$$$');
      
      //  console.log('$$$$$$$$$$$$$$$$$$$$$$$$'+JSON.stringify(o)+'$$$$$$$$$$$$$$$$$$$$$$$$');
    
        return (
          <div className="customized-tooltip-content" style={{fontWeight: 700, fontSize: '1.2em', backgroundColor: 'white', opacity: '80%' }}>
            <p className="total">{`${label} (Total: ${total})`}</p>
            <ul className="list">
              {res.map((entry, index) => (
                <li key={`item-${index}`} style={{ color: entry.color, fontWeight: entry.payload.dataKey == entry.name ? 800 : null}}>
                  {`${entry.name} - ${entry.value}hr ${entry.summary}:  (${getPercent(entry.value, total)})`}
                </li>
              ))}
            </ul>
          </div>
        );
      };



    useEffect(() => {
        setGraphInput(getStoryEstimatesPerDay(props.issues, new Date(props.sprint.startDate), new Date(props.sprint.endDate)));
       // setIssueTypes(getStoryIssueList(props.issues));
    }, [props.sprintId]);

    const stories = props.issues.filter(i => !i.fields.issuetype.subtask)

    return(
        <div>
          <textarea value={`${JSON.stringify(graphInput)}`} readOnly={true}/>
          <h1 style={{ textAlign: 'center'}}>Story - Remaining Time vs Sprint Dates</h1>
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
            <Tooltip content={renderTooltipContent}/>
            {stories == null ? null : stories.sort(issueSortEpic).map((it) => {
                return <Area type="monotone" dataKey={it.key} stackId="1" stroke={getColor(it)} fill={getColor(it)} />
            })};
        </AreaChart>
        <textarea value={JSON.stringify(issueTypes)} readOnly={true}/>
        </div>
        )
    }

    export default StoryRemainingEstimate





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
                       allEstimates.push({ 'date': new Date(hi.created), 'key': issue.key, 'parent': issue.fields.parent.key, 'remaining': estimateUpdateLog.to });
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


               issueTypes = _.uniqBy(rawSprint.issues.map((i) => ({ "key": i.key, "parent": i.fields.parent.key, "title": i.fields.summary })), 'parent')
               
               //// START DETAILED BURNDOWN
                var estimatesOnDates = [];
               sprintDates.forEach(d => {
                   estimatesOnDates.push({
                       date: d
                       , ...flow(
                           groupBy("parent"),
                       map((cat) => {
                           cat['remaining'] = cat.reduce((prev, curr) => prev + curr.remaining, 0);
                           return cat;
                        }, {}) // i want to get the to estiamte of the latest date
                        // minus two days to include estimates made before the sprints starts
                       )(allEstimates.filter(e => e.date < d && e.date > new Date(sprint.startDate).addDays(-2))) // Only include estimates made before this date 
                   });
               });
               
               estimatesOnDates.forEach((d) => {
                   var res = {};
                   res['date'] = d.date.toISOString().substring(0,10);


                 //  console.log('--------------------'+JSON.stringify(d)+'--------------------');
                  // console.log('--------------------'+JSON.stringify(allEstimates)+'--------------------');
                   
                   if(d.date < new Date()){
                       // Set the latest remaining date estimate
                       Object.keys(d).filter(f => f != 'date').forEach((key) => {
                           var totalRemainingEstimate = 0;
                           d[key].forEach((subTask) => {
                                
                                var latestEstimate = (d[key].filter(f => f.key == subTask.key).sort(f => f.date)[0].remaining / 3600)
                              //  console.log('Adding latest estimate of '+latestEstimate+' from '+subTask.key+'('+key+') to total of (before add) '+totalRemainingEstimate);
                                totalRemainingEstimate += latestEstimate;

                            //var firstFutureEstimate = (allEstimates.filter(e => e.key == key).sort(e => e.date)[0].remaining / 3600);

                            //}else if(firstFutureEstimate > 0){
                                // TODO: this is not working....
                              //  res[key] = firstFutureEstimate;
                            //}
                            });
                            if(totalRemainingEstimate > 0){
                                // latest estimate
                                res[key] = totalRemainingEstimate;
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


function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(new Date (currentDate));
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}