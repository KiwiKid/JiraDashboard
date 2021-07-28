import {Collapse} from 'react-collapse';

import React, {useState, useEffect} from 'react';

import MarkdownIt from 'markdown-it';
import _ from 'lodash';

import styles from '../styles/SprintSummary.module.css'


function getNiceDate(date){
    var realDate = new Date(date)
    return realDate.getDate()+'/'+realDate.getMonth()+'/'+realDate.getFullYear();
}

function SprintSummary(props){
 
    const md = new MarkdownIt();



    const niceStartDate = getNiceDate(props.sprint.startDate);
    const niceEndDate = getNiceDate(props.sprint.endDate);
    return(
        props.sprint == null ? null :
            <div className={styles.container}>
                <div className={styles.header}><a title="View Issue in Sprint in Jira" href={`https://streamliners.atlassian.net/issues/?jql=sprint%20%3D%20${props.sprint.id}`}>({props.sprint.id}) {props.sprint.name}</a></div>
                <div className={styles.goal}>{props.sprint.goal}
                    <div className={styles.state}> - {props.sprint.state} - {niceStartDate} - {niceEndDate}</div>
                </div>
                {props.issues == null ? null :
                    <div>
                        <h3>Remaining</h3>
                        Total: {props.issues.issues.filter(i => i.fields.issuetype.subtask).reduce((prev, curr) => prev += curr.fields.aggregatetimeestimate, 0)/3600}<br/>
                        DEV: {props.issues.issues.filter(i => i.fields.issuetype.subtask && i.fields.issuetype.name == "DEV").reduce((prev, curr) => prev += curr.fields.aggregatetimeestimate,0)/3600}<br/>
                        TEST: {props.issues.issues.filter(i => i.fields.issuetype.subtask && i.fields.issuetype.name == "TEST").reduce((prev, curr) => prev += curr.fields.aggregatetimeestimate,0)/3600}<br/>
                        GENERAL Time Remaining: {props.issues.issues.filter(i => i.fields.issuetype.subtask && i.fields.issuetype.name == "GENERAL").reduce((prev, curr) => prev += curr.fields.aggregatetimeestimate,0)/3600}<br/>
                    </div>}
                <textarea defaultValue={JSON.stringify(props)} readOnly={true} />
            </div>
    );
}
export default SprintSummary