
import JiraClient from 'jira-connector';

function JiraApiClient(host){

    var _jira = new JiraClient({
        host: host,
        basic_auth: {
            username: process.env.JIRA_USER,
            password: process.env.JIRA_API_TOKEN,
        }
    });



    async function getSprintStories(sprintId){
        return _jira.sprint.getSprintIssues({sprintId: sprintId, jql: "issuetype not in subTaskIssueTypes()", expand: "changelog", maxResults: 100})
    }


    async function getSprintSubTasks(sprintId){
        return _jira.sprint.getSprintIssues({sprintId: sprintId, jql: "issuetype in subTaskIssueTypes()", expand: "changelog", maxResults: 1000})
    }

    async function getEpics(maxResults, extendJql){
        var epics = []; 
        var issues;
        await search(`Project = DEV AND issuetype = Epic ${extendJql ? `AND ${extendJql}` : ""} ORDER BY created`, null, maxResults).then(epicRes => {
            epics = epicRes;

        });

        var idJql = epics.issues.reduce((prev, curr) => prev+= curr.key+",", "\"Epic Link\" in (");
        idJql = idJql.substring(0, idJql.length-1)+")";
        console.log(idJql);

        await search(idJql).then(issueRes => {
            issues = issueRes || null;
        })

        if(issues.issues != null && !!epics.issues){
            epics.issues.forEach((e) => {
             if(!!e && e.fields){
                e.fields.subtasks = issues.issues.filter((i) => i.fields.customfield_10016 == e.key);
                // Copy the fields to simulate issue population
                e.fields.subtasks.map((st) => ({...st, issue: st }));
            }
            })
        }
        return epics;
    }


    async function search(jql, fields, maxResults){
        return _jira.search.search({
             jql: jql
             , fields: fields || [
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
                 , 'closedSprint'
                 , 'parent'
                 , 'issuetype'
                 , 'status'
                 , 'fixVersions'
                 , 'creator'
                 , 'description'
                 , 'epicLink'
                 , 'parent'
                 , 'customfield_10016'  // Epic Key
                 , 'customfield_10500'
                 , 'customfield_10021' // Story point estimate
                 , 'comment'
            ]
            , expand: ['changelog'], maxResults: maxResults || 200 }).then(res => {
                if(res.issues){
                    res.issues.forEach(i => {
                        if (i.fields.subtasks) {
                            i.fields.subtasks.forEach(st => {
                                st.issue = res.issues.find(i => i.key == st.key) || null;
                            })
                        } else {
                        }

                        if(i.fields.customfield_10500){
                            var jsonString = i.fields.customfield_10500.substring(i.fields.customfield_10500.indexOf('json=')+5, i.fields.customfield_10500.length-1);
                            console.log(jsonString);
                            console.log(jsonString.length);
                            try{

                                i.fields.github = JSON.parse(jsonString);
                            }catch(err){
                                console.error(err);
                            }
                        }
                    });
                }
                return res;
            })

            
    }

    this.search = search; 
    this.getSprintStories = getSprintStories;
    this.getSprintSubTasks = getSprintSubTasks;
    this.getEpics = getEpics;
}

export default JiraApiClient