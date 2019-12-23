const getUserQuery = `
  query getUser($userName: String!) {
    User(userName: $userName){
      id
    }
  }
`;

const getFormQuery = `
    query getForm($setEndpoint: String!) {
      Forms(endpoint: $setEndpoint) {
        id
        apikey
        isDisabled
        redirect
        base
        table
        redirectUpdate
        googleCaptcha
      }
    }
  `;

  const saveFormDataMutation = `($formId: ID!, $data: [Json!]!, $record: String, $email: String, $url: String) {
    createContent(formsId: $formId, data: $data, record: $record, email: $email, url: $url) {
      id
    }
  }`;

  module.exports = {getUserQuery, getFormQuery, saveFormDataMutation};