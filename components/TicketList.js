import {Collapse} from 'react-collapse';

import React, {useState, useEffect, useReducer} from 'react';

import MarkdownIt from 'markdown-it';
import _, { fromPairs } from 'lodash';
import NeedsReleaseDate from '../data/allowNoFixVersion.js'
import Labels  from './../components/Labels.js';

import styles from '../styles/TicketList.module.css'
import ProgressBar from './ProgressBar.js';
import Expando from '../components/Expando.js';

import { getEpicColor,getStatusColor } from '../utils/jiraUtils.js'



function TicketList(props){
    const {issues } = props;
    //const[openTickets, setOpenTickets] = useReducer(OpenTicketReducer, []);
    const[openSummary, dispatchOpenSummary] = useReducer(OpenTicketReducer, []);

    const md = new MarkdownIt({ linkify: true});

  
      function OpenTicketReducer(state, action) {
          var index = state.indexOf(action.item);
        switch (action.type) {
          case 'add':
            return [...state, action.item];
          case 'remove':
            return [
              ...state.slice(0, index),
              ...state.slice(index + 1)
            ];
        case 'addRange':
            return action.item
            
        case 'removeAll':
                return []
          default:
            throw new Error();
        }
      }

   /* function toggleTicket(ticketId){
        if(openTickets.some(t => t == ticketId)){
            setOpenTickets(openTickets.filter(t => t != ticketId));
        }else{
            var res = openTickets;
            res.push(ticketId);
            setOpenTickets(res);
        }
    }*/

    const toggleSummary = (evt) => {
        var type = openSummary.some(t => t == evt.currentTarget.id) ? 'remove' : 'add';
        console.log(type+ ' : '+evt.currentTarget.id);
        console.log('total before: '+openSummary.length);
        dispatchOpenSummary({ type: type, item: evt.currentTarget.id });
        console.log('total after: '+openSummary.length);
    }
    function toggleAllSummary(){
        dispatchOpenSummary(
            openSummary.length > 0 
            ? { type: 'removeAll' } 
            : {type: 'addRange', item:  issues.issues.map((i) => i.key)  }
        );
        console.log('total after: '+openSummary.length);
    }

    function getNiceDate(date){
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        // This won't work around christmas...we dont work around christmas...
        var now = Date.now;
        if(date.getDate() - now > 7){
            return "last "+ days[date.getDay()];
        }
        return date.getDate()+'/'+date.getMonth()+'/'+date.getYear()
    }


    // TODO: get Epic info in api call and get color from there


    return(
        <div>
            <h1>Ticket List {openSummary.length}</h1>
            { openSummary !== undefined ? <button onClick={() => toggleAllSummary()}>{ openSummary.length > 0 ? "Close all" : "Open all"}</button> : <div><h2>Loading...</h2></div>}
            <div className={styles.grid}>
                {issues == null ? null : issues.issues.filter(i => !i.fields.issuetype.subtask).sort(i => i.fields.aggregateprogress.percent).map((s) => (
                    <div id={s.key} onClick={(evt) => !openSummary.some(ot => ot == s.key) ? toggleSummary(evt): null } className={`${openSummary.some(ot => ot == s.key) ? styles.bigCard : styles.smallCard} ${styles.card}`}>
                        <div>
                            <div style={{ height: '30px'}}> 
                                <span className={styles.cardHeader} style={{textAlign: 'left'}} >
                                    <a target="_blank" title="View Issue in Jira" href={'https://streamliners.atlassian.net/browse/'+s.key}>{s.key}</a>
                                </span>
                                <span className={styles.cardHeader} style={{textAlign: 'right', color: getStatusColor(s)}}>
                                    {s.fields.status.name}
                                </span>
                            </div>
                            {openSummary.some(ot => ot == s.key) ? 
                            
                            <h2 
                                id={s.key} 
                                className={styles.bigHeader} 
                                style={{ 
                                    backgroundImage: `linear-gradient(to right, #D3D3D3 0%, ${getEpicColor(s)}  51%, #757F9A  100%)` }}
                                     onClick={(evt) => openSummary.some(ot => ot == s.key) ? toggleSummary(evt) : null 
                                }>
                                {s.fields.summary}
                                <span class={'icon'}>
                                    <svg className="svg-icon" width={'1.2em'} height={'1.2em'} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M890.595556 674.891852 525.463704 322.275556c-1.232593-1.137778-2.56-2.085926-3.982222-2.939259-7.205926-4.361481-16.592593-3.508148-22.945185 2.56L133.404444 674.607407c-7.68 7.395556-7.774815 19.816296 0 27.306667 7.395556 7.205926 19.342222 6.826667 26.737778-0.379259l351.762963-339.626667c0 0 0 0 0.094815 0l352.047407 340.005926c7.395556 7.205926 19.342222 7.49037 26.737778 0.379259C898.37037 694.708148 898.275556 682.287407 890.595556 674.891852z"  />
                                    </svg>
                                </span>
                            </h2>
                            : <div
                                 id={s.key}
                                 className={styles.smallHeader}
                                 style={{backgroundImage: `linear-gradient(to right, #D3D3D3 0%, ${getEpicColor(s)}  51%, #757F9A  100%)` }}
                            > {s.fields.summary}</div>}
                        </div> 
                        <ProgressBar 
                            key={s.key} 
                            bgcolor={getStatusColor(s)} 
                            percent={s.fields.aggregateprogress.percent} 
                            progress={s.fields.aggregateprogress.progress}  
                            total={s.fields.aggregateprogress.total}/>
                        <div className={styles.row}>
                            <Labels issue={s} showExtended={openSummary.some(ot => ot == s.key)}/>
                        </div>
                        <div >
                            <Collapse isOpened={openSummary.some(ot => ot == s.key)} className={styles.row} >
                                <div className={styles.row}>
                                <div className={styles.column}>
                                    {s.fields.description == null ? null :
                                        <Expando htmlLengthLimit={400}>
                                            <div dangerouslySetInnerHTML={{ __html: md.render(s.fields.description)}}/>
                                        </Expando>}
                                    </div>
                                    <div className={styles.column}>
                                        {s.fields.subtasks != null ? s.fields.subtasks.map((st) => (
                                            !!st.issue ? 
                                            <ProgressBar 
                                                key={st.key} 
                                                bgcolor={getStatusColor(st)} 
                                                percent={st.issue.fields.aggregateprogress.percent} 
                                                progress={st.issue.fields.aggregateprogress.progress}  
                                                total={st.issue.fields.aggregateprogress.total}  
                                                title={(st.fields.customfield_10021 ? st.fields.customfield_10021 : "") + st.fields.summary}
                                             />: 
                                             <ProgressBar 
                                                key={st.key} 
                                                bgcolor={getStatusColor(st)} 
                                                percent={st.fields.aggregateprogress.percent} 
                                                progress={st.fields.aggregateprogress.progress}  
                                                total={st.fields.aggregateprogress.total}  
                                                title={st.fields.summary}
                                             />
                                    )): null}
                                    Subtasks:
                                    <textarea value={JSON.stringify(s.fields.subtasks)} readOnly={true}/>
                                    </div>
                                    <div className={styles.column}>
                                         <Expando arrayLimit={20}>
                                            {!!s.fields.comment ? s.fields.comment.comments.map((co) => (
                                                <div className={styles.comment}><div dangerouslySetInnerHTML={{__html: md.render(co.body)}}/><div>{co.author.displayName}</div></div> 
                                            )) : null}
                                        </Expando >
                                        {!!s.changelog.histories ? 
                                        <Expando  arrayLimit={20}>
                                            {s.changelog.histories.sort(co => co.created).reverse().map((co) => (
                                                co.items.map((i) => (
                                                    <div>{`${i.field} => ${i.to}`}   ({co.author.displayName}) ({getNiceDate(new Date(co.created))})</div>
                                                ))
                                            ))}
                                        </Expando>: null}
                                    </div>        
                                </div> 
                                <div className={styles.column}>
                                    <label for={"issue"+s.key}>Story JSON:</label>
                                    <textarea id={"issue"+s.key} text={200} width={200} defaultValue={JSON.stringify(s)} readOnly={true}/>
                                </div>
                            </Collapse>
                            <br/> 
                            <br/> 
                            
                        </div>
                    </div>
                ))};
            </div>
        </div>
    );
}
export default TicketList