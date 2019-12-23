// importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const {getUserQuery, getFormQuery, saveFormDataMutation} = require('./gql.js');
const Lokka = require("lokka").Lokka;
const Transport = require("lokka-transport-http").Transport;
const Airtable = require('airtable-node');

// defining the Express app
const app = express();

// defining an array to work as the database (temporary solution)
const ads = [
  {title: 'Hello, world (again)!'}
];

const graphCoolToken = process.env.GRAPHCOOL_TOKEN;
const headers = {
  Authorization: `Bearer ${graphCoolToken}`
};

const client = new Lokka({
  transport: new Transport("https://api.graph.cool/simple/v1/ck2sxfcgg2q7d0122025bs387", {
    headers
  })
});

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// defining an endpoint to return all ads
app.get('/', (req, res) => {
  res.send(ads);
});

// starting the server
app.listen(3001, () => {
  console.log('listening on port 3001');
});

app.post('/:username/:id', async (req, res) => {
  let str_data = JSON.parse(event.body);
  let data = Object.assign({}, querystring.parse(req.body));
  let fields = data;
  let air_data = Object.assign({fields});
  const userName = req.params.username;
  const getEndpoint = req.params.id;
  //checks and validates the parameters and the data
  if (!userName || !getEndpoint || !Object.keys(data).length) {
    console.error("Validation Failed");
    return res.status(500).send({error: 'Could not execute, missing fields...'});
  }

  function getValueByKey(object, key) {
    for (var prop in object) { 
      if (object.hasOwnProperty(prop)) { 
          if (prop == key) 
          return object[prop]; 
      } 
  } 
} 

const email = getValueByKey(data, 'Email');
const id = getValueByKey(str_data, 'userCode');
const AirtableRecord = getValueByKey(data, 'AirtableRecord');
const captchaId = getValueByKey(data, 'g-recaptcha-response');

  if (id !== undefined) {

    const getUserQueryVars = { userName };
    client
      .query(getUserQuery, getUserQueryVars)
      .then(result => {
      const userId = result.User.id;
      const setEndpoint = `${userId}/${getEndpoint}`;

    const getFormQueryVars = { setEndpoint };
    client
      .query(getFormQuery, getFormQueryVars)
      .then(result => {
        const formId = result.Forms.id;
        const isDisabled = result.Forms.isDisabled;
        const redirect = result.Forms.redirect;
        const googleCaptcha = result.Forms.googleCaptcha;
        if(googleCaptcha) {
          if(!captchaId || captchaId == '' || captchaId == undefined) {
            return res.status(500).send({error: 'Error validating the captcha, try again...'});
          }
          const rcaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${googleCaptcha}&response=${captchaId}`;
          fetch(rcaptchaUrl, {
            method:'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(resp => {
          if(resp.body.success !== undefined && !resp.body.success) {
            return res.status(500).send({error: 'This account is suspicious, go back and try again.'});
          }
        });
        }
        
        const airtable = new Airtable({ apiKey: result.Forms.apiKey })
          .base(result.Forms.base)
          .table(result.Forms.table)
        //checks if the form is enable to receive data submissions
        if (isDisabled) {
          return res.status(500).send({error: 'At this moment the form is not accepting submissions.'});
        }

        

        //verifies and saves the new data in the form
        const getFormDataMutation = `query getContent($id: ID!) {
          Content(id: $id) {
            id
            record
          }
        }`;
            const getFormDataMutationVars = {
              id
            };
        //gets the data from the DB
        client.query(getFormDataMutation, getFormDataMutationVars).then(result => {
            const id = result.Content.record
            airtable.retrieve(id).then(resp => {
              return res.json(resp);
            }).catch(e => {
              //sends a error if the data was not saved in the DB
              console.log(e);
              return res.status(500).json({error: e});
            });
          })
          .catch(e => {
            //sends a error if the data was not saved in the DB
            console.log(e);
            return res.status(500).json({error: e});
          });
      })
      .catch(e => {
        return res.status(500).json({error: e});
      });
  })
  .catch(e => {
    return res.status(500).json({error: e});
  });
  }
});

/*app.get('/:username/:id', async (req, res) => {
  res.send('Just a test');
});*/