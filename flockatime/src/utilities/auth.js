import { auth, fbProvider } from './fire';
import data from './data';
import ns from './notificationService';

export default {
  uid: "", 
  email: "",
  signUp: function (email, password) {
    // Call Firebase method to create user with email and password
    auth.createUserWithEmailAndPassword(email, password).then(function (user) {
      var userId = user.user.uid;
      auth.uid = userId;
      var userEmail = user.user.email;
      var emailObj = { email: userEmail };
      console.log(emailObj);

      // data.createUser(emailObj);
      data.createUser(emailObj);

      console.log("User created: " + userId);
      console.log("User created: " + userEmail);
    }).catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;

      console.log("Error code: " + errorCode);
      console.log("Error message: " + errorMessage);
    });
  },
  signIn: function (email, password) {
    auth.signInWithEmailAndPassword(email, password)
      .catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;

        console.log("Error code: " + errorCode);
        console.log("Error message: " + errorMessage);
      });
  },
  signOut: function () {
    // check if user is authenticated with facebook/twitter first
    auth.signOut().then(function () {
      auth.uid = "";
      ns.postNotification('AUTH_SIGNOUT', null);
    });
  },
  firebaseAuthListener: auth.onAuthStateChanged(function (user) {
    console.log('firebase auth listener fired');
    if (user) {
      auth.uid = user.uid;
      auth.email = user.email;
      console.log(auth.uid);
      ns.postNotification('AUTH_SIGNIN', null);
    }
    else {
      auth.uid = "";
      auth.email = "";
      ns.postNotification('AUTH_SIGNOUT', null);
    }
  }),
  checkLoginState: function (event) {
    console.log('checking Facebook Login State');
    if (event.authResponse) {
      console.log(event.authResponse);
      // User is signed-in Facebook.
      var unsubscribe = auth.onAuthStateChanged(function (firebaseUser) {
        unsubscribe();
        console.log(firebaseUser);
        // Check if we are already signed-in Firebase with the correct user.
        if (!auth.isUserEqual(event.authResponse, firebaseUser)) {
          // Build Firebase credential with the Facebook auth token.
          var credential = fbProvider.credential(
            event.authResponse.accessToken);
          // Sign in with the credential from the Facebook user.
          auth.signInAndRetrieveDataWithCredential(credential).then(function(cred) {
            auth.uid = cred.user.uid;
            data.createUser({email: cred.user.email});
          }).catch(function (error) {
            var errorCode = error.code;
            console.log(errorCode);
          });
        } else {
          // User is already signed-in Firebase with the correct user.
        }
      });
    } else {
      // User is signed-out of Facebook.
      auth.signOut();
    }
  },
  isUserEqual: function(facebookAuthResponse, firebaseUser) {
    if (firebaseUser) {
      var providerData = firebaseUser.providerData;
      for (var i = 0; i < providerData.length; i++) {
        if (providerData[i].providerId === fbProvider.PROVIDER_ID &&
          providerData[i].uid === facebookAuthResponse.userID) {
          // We don't need to re-auth the Firebase connection.
          return true;
        }
      }
    }
    return false;
  }
};