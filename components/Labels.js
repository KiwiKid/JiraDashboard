import { flow, groupBy } from 'lodash';
import styles from '../styles/Labels.module.css'

import {getEpicColor,getStatusColor, issueSortEpic} from '../utils/jiraUtils.js'

const colors = {
    'bad': 'red',
    'good': 'green',
    'medium': 'blue'
}

function Labels(props){
    const { showExtended } = props;
    const labels = getLabels(props.issue, showExtended);
    return <>
        <label for="labels">Labels:</label>
        <textarea id="labels" defaultValue={JSON.stringify(props)}/> 
        {labels.map((l) => (
            <div className={styles.labels} style={{ borderColor: l.color}}>
                <span className={styles.labelsTitle}>{l.name}</span>
                <br/>
                {typeof(l.field) == 'string' && l.field.startsWith('DEV-') ? 
                    <a target="_blank" title="View Issue in Jira" href={"https://streamliners.atlassian.net/browse/"+l.field}>{l.field}</a> 
                    : l.field}
            </div>
        ))}
    </>
};

function getLabels(i, showExtended){
    
    var res = []
    if(i.fields.customfield_10016){
        res.push({'name': 'epic', 'field': i.fields.customfield_10016 })
    }
    if(getEpicColor(i) == '#d3d3d3'){
        res.push({'name': 'No Epic color', 'color': colors.bad })
    }

    if(showExtended){
        res.push({'name': 'creator', 'field': i.fields.creator.displayName })
        res.push({'name': 'comments', 'field': i.fields.comment.count })
        res.push({'name': 'issuetype', 'field': i.fields.issuetype.name })
    }



    if(i.fields.closedSprints > 0){
        res.push({'name': 'SprintCount', 'field': i.fields.closedSprints.length, 'color': colors.bad })
    }
    if(i.fields.closedSprints > 0){
        res.push({'name': 'SprintCount', 'field': i.fields.closedSprints.length, 'color': colors.bad })
    }
 
    if(i.fields.fixVersions.length == 0 && NeedsReleaseDate(i)){
        res.push({'name': 'No Release', 'color': colors.bad })
    }

    if(i.fields.aggregatetimeestimate == 0 && NeedsEstimate(i)){
        res.push({'name': 'No Estimate', 'color': colors.bad })
    }


    if(!!i.fields.github && !!i.fields.github.cachedValue.summary.pullrequest) {
        var pullrequest = i.fields.github.cachedValue.summary.pullrequest;
        switch(pullrequest.overall.state){
            case "MERGED": 
                res.push({'name': 'Merged PR', 'color': colors.good })
                break;
            case "OPEN": 
                res.push({'name': 'Open PR' })
                break;
            default:
                res.push({'name': 'PR '+pullrequest.overall.state, 'color': colors.bad });
                break;
        }
    }else if(NeedsPullRequest(i)){
        res.push({'name': 'No Pull Request', 'color': colors.bad })
    }


    if(i.fields.subtasks){
        if(!!i.issue){
            var subTasksWithRemainingTime = i.fields.subtasks.filter(st => 
                st.issue.fields.status.name == "-Done"
            && (!!st.issue ? st.issue.fields.aggregatetimeestimate : st.fields.aggregatetimeestimate) > 0) || [];
            subTasksWithRemainingTime.forEach(est => 
                res.push({'name': 'Done Task with time ('+(est.issue.fields.aggregatetimeestimate/3600)+'hrs)', 'field': est.key, 'color': colors.bad })
            )

            var subtasksWithNoTime = i.fields.subtasks.filter(st => 
                st.issue.fields.status.name != "-Done")
                    .filter(st => 
                            !st.issue.fields.aggregatetimeestimate ||
                            (st.issue.fields.aggregatetimeestimate === 0 && 
                                (st.issue.fields.aggregateprogress.percent != 100))
                    );
                    
        subtasksWithNoTime.forEach(st =>
            res.push({'name': 'No Time on Task', 'field': st.key, 'color': colors.bad })
        )
         }


    }else{
        res.push({'name': 'No sub-tasks', 'field': i.key, 'color': colors.bad })
    }
/*        var devSubTasks = getSubIssues(i.fields.subtasks, "DEV");
        var testSubTasks = getSubIssues(i.fields.subtasks, "TEST");
        var general = getSubIssues(i.fields.subtasks, "GENERAL");

        subTasksWithRemainingTime.forEach(est => 
            res.push({'name': 'ST with remaining time ('+(est.issue.fields.aggregatetimeestimate/3600)+'hrs)', 'field': est.key, 'color': colors.bad })
        )*/


    res.push({'name': 'Subtasks', 'field': i.fields.subtasks.length, 'color': i.fields.subtasks.length == 0 ? colors.bad : colors.good })
    return res;
}
function NeedsReleaseDate(issue){
    if(issue.fields.summary.startsWith("Planned Task")){
        return false;
    }
    if(issue.fields.customfield_10016 == "DEV-5610"){
        return false;
    }
    return true;
}

function NeedsPullRequest(issue){
    if(issue.fields.summary.startsWith("Planned Task")){
        return false;
    }
    return true;
}

function NeedsEstimate(issue){
    return false;
}

 export default Labels;