//import JiraApi from 'jira-client';
import { useRouter } from 'next/router'
import flow from 'lodash/fp/flow';
import groupBy from 'lodash/fp/groupBy';
import sumBy from "lodash/fp/sumBy";
import map from "lodash/fp/map";
import _ from 'lodash';

import SubTaskRemainigEstimate from '../../components/SubTaskRemainingEstimate.js';
import StoryRemainingEstimate from '../../components/StoryRemainingEstimate.js';
import SprintSummary from '../../components/SprintSummary.js';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TicketList from '../../components/TicketList.js';
import { getSprintFromIssue, getStoryEstimatesPerDay, getStoryIssueList } from '../../utils/jiraUtils.js'

import { LineGraph } from 'recharts'

import JiraApiClient from '../../utils/jiraApiClient.js'

function BasicSummary({ sprint, searchResults, TMPsprintSubTasks, TMPsprintStories }) {

    const router = useRouter();
    const sprintId  = router.query.sprint;

    return (
        <div>
           <SprintSummary sprint={sprint} issues={searchResults}></SprintSummary>
            searchResults: <textarea defaultValue={JSON.stringify(searchResults)} readOnly={true}/><br/>
              SprintSubTasks: <textarea defaultValue={JSON.stringify(TMPsprintSubTasks)} readOnly={true}/><br/>
              SprintStories:<textarea defaultValue={JSON.stringify(TMPsprintStories)} readOnly={true}/><br/>
      </div>
  )
  }

  export async function getStaticPaths(){
    return {paths: [
        { params: { sprint: '155' }}
      , {params: { sprint: '156' }}]
      , fallback: false};
  }



  export async function getStaticProps(context) {

   // runTest();

    const sprintId  =  parseInt(context.params.sprint);
    // Fetch data from external API
            // Initialize
            var jira = new JiraApiClient('streamliners.atlassian.net');

            var searchResults;
            await jira.search("Sprint = "+sprintId).then(res => searchResults = res);

            var sprintSubTasks
            await jira.getSprintSubTasks(sprintId).then(res => sprintSubTasks = res);

var TMPsprintStories
await jira.getSprintStories(sprintId).then(res => TMPsprintStories = res);

var TMPsprintSubTasks = sprintSubTasks;

            var sprint = getSprintFromIssue(sprintSubTasks.issues[0], sprintId);
            
    // Pass data to the page via props
    return { props: { sprint, searchResults, TMPsprintSubTasks, TMPsprintStories } };
  
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
  
function runTest(){
    var testRawData = {
        issues: [{
            changelog: {
                histories: [
                    {
                        created	:	"2021-01-01T01:01:00.000+1200"
                        ,items: [
                            { field: 'timeestimate', to: 3600 }
                        ] 
                    },
                    {
                        created	:	"2021-01-02T01:01:00.000+1200"
                        ,items: [
                            { field: 'timeestimate', to: 7200 }
                        ] 
                    },
                    {
                        created	:	"2021-01-03T01:01:00.000+1200"
                        ,items: [
                            { field: 'timeestimate', to: 1800 }
                        ] 
                    },
                    {
                        created	:	"2021-01-04T01:01:00.000+1200"
                        ,items: [
                            { field: 'timeestimate', to: 0 }
                        ] 
                    }
                ]   
            },
            fields: {
                key: 'DEV-001'
            }
        }]
    };
}



  export default BasicSummary;
  