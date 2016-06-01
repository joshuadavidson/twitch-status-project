//Set a cookie with supplied name, value, and expiry
function setCookie(cookieName, cookieValue, expiryDays) {
  if (expiryDays === undefined) { //If not expiry given make the cookie never expire
    document.cookie = cookieName + '=' + cookieValue + '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
  } else { //else set the expiry date based on passed value
    var expiryDays = expiryDays || 30;
    var date = new Date();
    date.setTime(date.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    document.cookie = cookieName + '=' + cookieValue + '; expires=' + date.toUTCString();
  }
}

//delete the cookie by setting it's expiry date in the past
function deleteCookie(cookieName) {
  document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
}

//get the value of a cookie with cookieName
function getCookieValue(cookieName) {
  var cookieName = cookieName + '='
  var allCookies = document.cookie.split(';');
  for (var i = 0; i < allCookies.length; i++) {
    var currentCookie = allCookies[i];
    if (currentCookie.indexOf(cookieName) === 0) {
      return currentCookie.substring(cookieName.length, currentCookie.length);
    }
  }
  return '';
}

//function constructor for channel objects
function Channel(username) {
  this.username = username;
  this.channelJSON = {};
  this.userJSON = {};
}

//Add method to promise so that each channel object receives it
//get Twitch channel information as a promise
Channel.prototype.getChannelInfo = function() {
  var self = this; //ensure that the Channel object is visible within the promise
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: 'https://api.twitch.tv/kraken/streams/' + self.username,
      data: {
        'client_id': '9gqb16o5nkdypg2smko1jqmipl2hg0l'
      },
      dataType: 'jsonp',
      type: 'GET',
      success: function(channelData) {
        self.channelJSON = channelData; //store the data from Twitch
        resolve(); //resolve the promise with nothing to return
      },
      error: function(err) {
        console.log('Twitch API call failed: Get Channel Info' + err);
        reject(err);
      }
    });
  });
}

//Add method to promise so that each channel object receives it
//get Twitch user information as a promise
Channel.prototype.getUserInfo = function() {
  var self = this; //ensure that the Channel object is visible within the promise
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: 'https://api.twitch.tv/kraken/users/' + self.username,
      data: {
        'client_id': '9gqb16o5nkdypg2smko1jqmipl2hg0l'
      },
      dataType: 'jsonp',
      type: 'GET',
      success: function(userData) {
        self.userJSON = userData;
        resolve();
      },
      error: function(err) {
        console.log('Twitch API call failed: Get User Info' + err);
        reject(err);
      }
    });
  });
}

//Add method to promise so that each channel object receives it
//get Twitch data asynchronously by using a promise
Channel.prototype.getTwitchData = function() {
  var self = this; //ensure that the Channel object is visible within the promise

  return new Promise(function(resolve, reject) { //crate a promise that will ensure both ajax requests complete
    Promise.all([//use all to run both promises in parallel
      self.getChannelInfo(),
      self.getUserInfo()
    ]).then(function(){//when both of the above promises complete, resolve the getTwitchData promise
      resolve(self);
    }).catch(function(err){//if either of the above promises error, throw the error
      reject(err);
    });
  });
}

//Main object for Twitch data
var Streamers = {
  usernameList: [],
  channelList: [],

  initialize: function() { //set up the Streamers object
    if (getCookieValue('usernameList') !== '') { //Get previous list of usernames
      this.usernameList = getCookieValue('usernameList').split(',');
    } else { //Use default list
      this.usernameList = ['ESL_SC2', 'OgamingSC2', 'cretetion', 'freecodecamp', 'storbeck', 'habathcx', 'RobotCaleb', 'noobs2ninjas', 'jwaynedavidson'];
      setCookie('usernameList', this.usernameList);
    }

    //populate the channelList array with blank channel objects from the usernameList
    for (var username of this.usernameList) {
      this.channelList.push(new Channel(username));
      console.log('Added ' + username + ' to channelList.');
    }

    return this; //make methods chainable
  },

  add: function(username) {
    this.usernameList.push(username);
    this.channelList.push(new Channel(username));
    return this; //make methods chainable
  },

  saveToCookie: function() {
    setCookie('usernameList', this.usernameList);
    return this; //make methods chainable
  }
}

//generate the HTML required for a user staus row
function getStatusRowHTML(username, logoURL, gameTxt, statusTxt) {
  var html = ''
  var profilePicURL = profilePicURL || './img/GlitchIcon_white.png' //set glitch icon if no Profile Pic
}



$(document).ready(function() {
  //initialize the Streamers object and pull data from Twitch
  Streamers.initialize();
  console.log('Done initializing. Here is channelList ');
  console.log(Streamers.channelList);

  //ensure that all channels have been populated with data
  for (var channel of Streamers.channelList) {
    channel.getTwitchData().then(function(channel){
      console.log(channel.userJSON.logo);
    });
  }

  //add a user via the form
  $('#username-form').submit(function(event) {
    addUser(document.getElementById('username-input').value);
    this.reset(); //clear the form after submitting
    event.preventDefault(); //prevent default submit which reloads page
  });

  //before closing or refreshing update the cookie with the most recent usernameList
  window.addEventListener("beforeunload", function() {
    Streamers.saveToCookie();
  }, false);

});
