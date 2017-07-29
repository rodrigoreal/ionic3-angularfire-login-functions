const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors')({ origin: true });

const Users = require('./users.js');

const app = express();
admin.initializeApp(functions.config().firebase);

const validateFirebaseIdToken = (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>');
    res.status(403).json({
      error: 'Unauthorized',
    });
    return;
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  admin.auth().verifyIdToken(idToken).then((decodedIdToken) => {
    req.user = decodedIdToken;
    next();
  }).catch((error) => {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send({
      error: 'Unauthorized',
    });
  });
};

app.use(cors);
app.use(validateFirebaseIdToken);

app.post('/users', (req, res) => {
  const users = new Users();
  users.create(req.user, req.body.facebook).then(() => {
    res.status(201).json({});
  }, () => {
    res.status(400).json({
      code: 'USER_EXIST',
    });
  });
});

exports.api = functions.https.onRequest(app);
