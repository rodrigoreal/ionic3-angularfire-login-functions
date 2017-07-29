const admin = require('firebase-admin');

module.exports = class Users {
  constructor() {}

  create(firebaseUser, facebook) {
    return new Promise((resolve, reject) => {
      // Check if this user already exists
      admin.database().ref(`users/${firebaseUser.user_id}`)
        .once('value').then((userSnap) => {
          if (userSnap.val() === null || !userSnap.val().profile) {
            let username = firebaseUser.user_id;
            const user = {
              email: firebaseUser.email,
              createdAt: new Date(Date.now()),
            };

            if (firebaseUser.firebase.sign_in_provider === 'password') {
              username = firebaseUser.email.substring(0, firebaseUser.email.lastIndexOf('@')) || firebaseUser.user_id;
              username = username.replace(/[^\w]/gi, '').toLowerCase();
              user.profile = {
                image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzaLMnex1QwV83TBQgxLTaoDAQlFswsYy62L3mO4Su-CMkk3jX',
                thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzaLMnex1QwV83TBQgxLTaoDAQlFswsYy62L3mO4Su-CMkk3jX',
              };
            } else if (firebaseUser.firebase.sign_in_provider === 'facebook.com') {
              username = firebaseUser.name.replace(/[^\w]/gi, '').toLowerCase() || firebaseUser.user_id;
              user.facebook = facebook;
              user.profile = {
                image: firebaseUser.picture,
                thumbnail: firebaseUser.picture,
                name: firebaseUser.name,
              };
            }
            // Get an available username
            Users.getAvailableUsername(username).then((availableUsername) => {
              user.profile.username = availableUsername;
              admin.database().ref(`users/${firebaseUser.user_id}`)
                .update(user)
                .then(() => {
                  admin.database().ref('usernames').update({
                    [availableUsername]: firebaseUser.user_id,
                  }).then(() => {
                    resolve();
                  });
                });
            });
          } else if (firebaseUser.firebase.sign_in_provider === 'facebook.com') {
            resolve();
          } else {
            reject();
          }
        });
    });
  }

  static getAvailableUsername(username) {
    return new Promise((resolve) => {
      admin.database().ref(`usernames/${username}`)
        .once('value').then((usernameSnap) => {
          if (usernameSnap.val() === null) {
            resolve(username);
          } else {
            Users.getAvailableUsername(`${username}_${Math.floor((Math.random() * 100000) + 1)}`)
              .then((response) => {
                resolve(response);
              });
          }
        });
    });
  }
};
