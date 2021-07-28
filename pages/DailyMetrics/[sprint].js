//import JiraApi from 'jira-client';
import { useRouter } from 'next/router'
import JiraClient from 'jira-connector';
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
import { getSprintFromIssue, getStoryEstimatesPerDay } from '../../utils/jiraUtils.js'

import { LineGraph } from 'recharts'

import JiraApiClient from '../../utils/jiraApiClient.js';
//groupedByDay,
function DailyMetrics({ rawSpritSubTasks, rawSprintStories, sprint, searchResults }) {

    const router = useRouter();
    const sprintId = router.query.sprint;

    return (
        <div>
            {<textarea defaultValue={JSON.stringify(searchResults)} readOnly={true}/>}
            <div>
                <div>
                    <SprintSummary sprint={sprint}></SprintSummary>
                </div>
                <div style={{ width: 1700, height: 800 }}>
                    <ResponsiveContainer>
                        <StoryRemainingEstimate sprint={sprint} issues={searchResults.issues} rawData={rawSpritSubTasks} rawStories={rawSprintStories} sprintId={sprintId} />
                    </ResponsiveContainer>
                </div>
                <TicketList issues={searchResults} />
                <div style={{ width: 1700, height: 800 }}>
                    <ResponsiveContainer>
                        <SubTaskRemainigEstimate rawData={rawSpritSubTasks} sprintId={sprintId} />
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
}


export async function getStaticPaths() {

    var paths = [{ params: {sprint: '156' } }, { params: {sprint: '155' }},{ params: {sprint: '153' }}]

    //for(var i = 153; i++; i< 157){
    //    paths.push({params: { sprint: i.toString()}});
    //}
    return {
        paths: paths
        , fallback: false
    };
}

export async function getStaticProps(context) {




    const sprintId = parseInt(context.params.sprint);
    // Fetch data from external API
    // Initialize


    var jira = new JiraApiClient('streamliners.atlassian.net');


    var rawSpritSubTasks
    await jira.getSprintSubTasks(sprintId).then(res => {
        rawSpritSubTasks = res
        console.log(rawSpritSubTasks.issues.length + ' subtasts found in search')
    });

    // AND issuekey = DEV-5628 or parent = DEV-5628
    var jql = "Sprint = " + sprintId;
    var searchResults
    await jira.search(jql).then(res => {
        searchResults = res
        console.log(searchResults.issues.length + ' issues found in sprint')
    });

    /*
     await jira.search.search({
            jql: jql
        , fields: [
        "aggregatetimeestimate"
        , "subtasks"
        , "aggregateprogress"
        , "worklog"
        , 'timetracking'
        , 'summary'
        , 'epic'
        , 'currentSprint'
        , 'currentsprint'
        , 'sprint'
        , 'closedSprints'
        , 'parent'
        , 'issuetype'
        , 'status'
        , 'fixVersions'
        , 'creator'
        , 'description'
        ], expand: ['names','schema','changelog'], maxResults: 150 }).then((res) =>{
            searchResults = res
        });*/





    //   searchResults.issues = searchResults.issues.map((i) => i.fields.subtasks = i.fields.subtasks.map(st => st.issue = searchResults.issues.find(i => i.key = st.key)));

    /*
    
                var rawSprintStories
                await jira.getSprintStories(sprintId).then(res => {
                        console.log(rawSprintStories.issues.length + ' stories found')
                    rawSprintStories = res
                });
                    */

    var sprint = getSprintFromIssue(rawSpritSubTasks.issues[0], sprintId);
    console.log((!!sprint ? 'sprint found' : 'no sprint found'));
    searchResults.dates = {
        estimates: {
            story: getStoryEstimatesPerDay(searchResults.issues, new Date(sprint.startDate), new Date(sprint.endDate)),
            // subtasks: getSubtaskEstimatesPerDay(searchResults.issues)
        }
    }


    // Time Spent
    /*      var allWorkLogs = [];
          var remainingTime = 0;
          await jira.sprint.getSprintIssues({sprintId: sprintId, jql: "issuetype in subTaskIssueTypes()"}).then(res => {
                  res.issues.forEach(i => {
                      if (!!i.fields.worklog && !!i.fields.worklog.worklogs) {
                          i.fields.worklog.worklogs.forEach(wl => {
                              try {
                                  if (!wl.started.length) {
                                      throw new Exception('No worklog start date?');
                                  }
                                  allWorkLogs.push(new WorkLog(i.key, wl.timeSpentSeconds / 3600, wl.started.substring(0, 10), i.fields.issuetype.name));

                              } catch (err) {
                                  console.log(err);
                              };
                          });
                      }
                  })
              });*/

    var rawSprintStories = { issues: [] }

    // var groupedByDay = formatForLineGraph(getWorkLogsGroupedByDay(allWorkLogs));

    // Pass data to the page via props
    return { props: { rawSpritSubTasks, rawSprintStories, sprint, searchResults } };
}

function formatForLineGraph(object) {
    return object.map(wl => Object.keys(wl).reduce((prev, curr) => {
        if (curr == "date") {
            prev["name"] = wl["date"];
            return prev//{prev, ...{name : wl.date }}
        } else {
            prev[wl[curr].type] = wl[curr].total;
            return prev;
        }
    }, {}));
}

function getWorkLogsGroupedByDay(res) {
    return flow(
        groupBy("date"),
        map((worklogs, dateGrouping) => {
            return ({
                date: worklogs[0].date,
                ...flow(
                    groupBy("type"),
                    map((worklogs, type) => {
                        return ({
                            type: worklogs[0].type,
                            total: worklogs.reduce((prev, curr) => prev + curr.timeSpent, 0),//sumBy(worklogs, 'timeSpent'),
                            logs: worklogs
                        })
                    })
                )(worklogs)
            })
        })
    )(res);
}

class WorkLog {
    constructor(key, timeSpent, date, type) {
        this.date = date;
        this.timeSpent = timeSpent;
        this.key = key;
        this.type = type;
    }
}
/*
  function getDates(startDate, stopDate) {
    var dateArray = new Array();
                var currentDate = startDate;
                while (currentDate <= stopDate) {
                    dateArray.push(new Date(currentDate));
                currentDate = currentDate.addDays(1);
    }
                return dateArray;
}*/

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

export default DailyMetrics;