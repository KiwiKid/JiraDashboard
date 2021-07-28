import { props } from 'lodash/fp';
import TicketList from '../../components/TicketList';
import JiraApiClient from '../../utils/jiraApiClient';

function Search({ searchResults }) {
  return <TicketList issues={searchResults}/>
}

export async function getStaticPaths() {
  return {
      paths: [{ params: { jql: 'epics' } }]
      , fallback: false
  };
}

export async function getStaticProps(context) {
  var jql = context.params.jql;
  if(jql == 'epics'){
    jql = "issuetype = Epic"
  }

  var jira = new JiraApiClient('streamliners.atlassian.net');

  var searchResults
  await jira.search(jql).then(res => {
      searchResults = res
      //console.log(res.issues[0]);
      console.log(searchResults.issues.length + ' issues found in sprint')
  });

  
    // Pass data to the page via props
    return { props: { searchResults } };
}
export default Search
