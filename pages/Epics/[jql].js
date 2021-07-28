import { divide } from 'lodash';
import { props } from 'lodash/fp';
import TicketList from '../../components/TicketList';
import JiraApiClient from '../../utils/jiraApiClient';

function Epics({ epics }) {
  return (epics == null 
    ? <div>loading...</div> 
    : <><textarea value={JSON.stringify(epics)} readOnly={true} />{<TicketList issues={epics}/>}</>
    )
}

export async function getStaticPaths() {
  return {
      paths: [
          { params: { jql: '"Epic%20Name"%20~%20"Arch*"' } }
      ]
      , fallback: true
  };
}


export async function getStaticProps(context) {
  var jql = decodeURIComponent(context.params.jql);

  

  var jira = new JiraApiClient('streamliners.atlassian.net');

  var epics;
 await jira.getEpics(20, jql).then(epicsRes => {
    //console.log(epics)
    epics = epicsRes
  });
  var epics = JSON.parse(JSON.stringify(epics));
    return { props: { epics } };
    // Pass data to the page via props
    
}
export default Epics
