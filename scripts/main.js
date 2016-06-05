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
  this.channelJSON = {}; //set up empty object for Twitch channel data
  this.userJSON = {}; //set up empty object for Twitch user data
  this.html = '';
}

//function that returns ajax promise to retrieve channel info bound to channel object
Channel.prototype.getChannelInfo = function() {
  var self = this; //ensure that the Channel object is visible within the ajax promise
  return $.ajax({ //return the ajax promise
    url: 'https://api.twitch.tv/kraken/streams/' + self.username,
    data: {
      'client_id': '9gqb16o5nkdypg2smko1jqmipl2hg0l'
    },
    dataType: 'jsonp',
    type: 'GET'
  });
}

//function that returns ajax promise to retrieve user info bound to channel object
Channel.prototype.getUserInfo = function() {
  var self = this; //ensure that the Channel object is visible within the ajax promise
  return $.ajax({ //return the ajax promise
    url: 'https://api.twitch.tv/kraken/users/' + self.username,
    data: {
      'client_id': '9gqb16o5nkdypg2smko1jqmipl2hg0l'
    },
    dataType: 'jsonp',
    type: 'GET'
  });
}

//get Twitch data asynchronously by using a promise
Channel.prototype.getTwitchData = function() {
  var self = this; //ensure that the Channel object is visible within the promise
  return new Promise(function(resolve, reject) { //crate a promise that will ensure both ajax requests complete
    Promise.all([ //use all to run both promises in parallel
      self.getChannelInfo(),
      self.getUserInfo()
    ]).then(function(twitchData) { //when both of the above promises complete, update data and resolve the getTwitchData promise
      self.channelJSON = twitchData[0]; //save the twitch data to the channel object.
      self.userJSON = twitchData[1]; //save the twitch data to the channel object.
      self.getHTML(); //generate the HTML for the page
      resolve(self); //return the channel object once resolved
    }).catch(function(err) { //if either of the above promises error, throw the error
      reject(jqXHR, textStatus, errorThrown); //if there is an error return the error
    });
  });
}

//function to generate the HTML needed for each channel
Channel.prototype.getHTML = function() {
  var state = this.channelJSON.stream ? 'online' : 'offline'; //get the online state of the user, if stream exists
  var logoURL = this.userJSON.logo || './img/GlitchIcon_white.png'; //show the default twitch icon if no logo is present
  var channelURL = 'https://www.twitch.tv/' + this.username; //generate the channel url by appending username to twitch.tv
  var displayName = this.userJSON.display_name || this.username; //if the user has a display name use it other wise use the typed in username
  var status; //status to display

  if (this.channelJSON.stream === null) { //if valid user but not streaming show status offline
    status = 'Offline';
  } else if (this.channelJSON.stream === undefined) { //if user is not valid show message from Twitch
    status = this.channelJSON.message;
  } else {
    status = this.channelJSON.stream.channel.game + ': ' + this.channelJSON.stream.channel.status;
  }
  //generate the html for the stream row
  this.html = '<div class="row stream-row">' + //main row container for stream data
    //column for profile logo
    '<div class="col-xs-2 text-center">' +
    '<a href="' + channelURL + '" target="_blank"><img class="profile-img ' + state + '" src="' + logoURL + '" /></a></div>' +
    //column for delete-icon
    '<div class="col-xs-2 col-xs-push-8 text-center icon-vcenter">' +
    '<i class="delete-icon fa fa-minus-square fa-2x" title="Delete User" aria-hidden="true"></i></div>' +
    //column for username
    '<div class="col-sm-3 col-xs-8 col-xs-pull-2 text-left text-vcenter">' +
    '<span class="username"><i class="user-icon fa fa-user fa-lg" title="Username" aria-hidden="true"></i> ' +
    '<a href="' + channelURL + '" target="_blank">' + displayName + '</a></span></div>' +
    //column for game/status
    '<div class="col-sm-5 col-xs-8 col-xs-pull-2 text-left text-vcenter">' +
    '<i class="game-icon fa fa-gamepad fa-lg" title="Status" aria-hidden="true"></i> <span class="status">' + status + '</span></div></div>';

  $('#status-block').prepend(this.html); //As soon as HTML is generated show it on the page

  return this.html;
}

//Main object for Twitch data
var Streamers = {
  usernameList: [],
  channelList: [],
  twitchDataPromiseList: [],

  initialize: function() { //set up the Streamers object
    var self = this; //ensure that the Streamers object is visible within the promise
    return new Promise(function(resolve, reject) {
      if (getCookieValue('usernameList') !== '') { //Get previous list of usernames
        self.usernameList = getCookieValue('usernameList').split(',');
      } else { //Use default list
        self.usernameList = ['ESL_SC2', 'freecodecamp', 'jwaynedavidson'];
        setCookie('usernameList', self.usernameList);
      };

      //populate the channelList array with blank channel objects from the usernameList
      for (var username of self.usernameList) {
        self.channelList.push(new Channel(username));
      };

      //create an array of promises to be executed to get Twitch data
      //fetch all of the twitch data simultaneously and wait for all to resolve
      Promise.all(self.channelList.map(function(channel) {
        return channel.getTwitchData();
      })).then(function(values) {
        resolve(values) //when done return an array containing each channel object
      }).catch(function(err) {
        reject(jqXHR, textStatus, errorThrown); //if there is an error return the error
      });

      return self; //make methods chainable
    });
  },

  //function to add a username
  addUser: function(username) {
    this.usernameList.unshift(username); //add the username to the usernameList
    this.channelList.unshift(new Channel(username)); //add the empty channel to the channeList

    this.channelList[0].getTwitchData().catch(function(err) {
      console.log(err);
    });
  },

  //function to remove username
  removeUser: function(username) {
    var usernameIndex = this.findUsernameIndex(username);
    var channelIndex = this.findChannelIndex(username);

    if (usernameIndex >= 0) { //if username was found remove it from the list
      this.usernameList.splice(usernameIndex, 1);
    }

    if (channelIndex >= 0) { //if channel with given username is found remove it from the list
      this.channelList.splice(channelIndex, 1);
    }
  },

  //function to take username and return usernameList index, -1 if DNE
  findUsernameIndex: function(username) {
    return this.usernameList.findIndex(function(value) { //find the index of the username in the list
      return username.toLowerCase() === value.toLowerCase();
    });
  },

  //function to take username and return channelList index, -1 if DNE
  findChannelIndex: function(username) {
    for (var i = 0; i < this.channelList.length; i++) {
      if (this.channelList[i].username.toLowerCase() === username.toLowerCase()) {
        return i;
      }
    }
  },

  saveToCookie: function() {
    setCookie('usernameList', this.usernameList);
    return this; //make methods chainable
  }
}

$(document).ready(function() {
  //initialize the Streamers object and pull data from Twitch
  Streamers.initialize().catch(function(err) {
    console.log(err);
  });

  //Delete stream when user clicks on delete-icon
  $('#status-block').on('click', '.delete-icon', function() {
    var username = $(this).parent().parent().find('span > a').html(); //find the username in the div
    Streamers.removeUser(username); //remove the user from the Streamers object
    $(this).parent().parent().remove(); //remove the row from the html
  });

  //add a user via the form
  $('#username-form').submit(function(event) {
    var inputValue = document.getElementById('username-input').value; //store the input from the input box
    if (/^[a-zA-Z0-9_]{3,25}$/.test(inputValue) && Streamers.findUsernameIndex(inputValue) === -1) { //check to see if username is valid Twitch username and not in list
      Streamers.addUser(inputValue); //add the user
      this.reset(); //clear the form after submitting
      event.preventDefault(); //prevent default submit which reloads page
    } else if (Streamers.findUsernameIndex(inputValue) !== -1) { //If username is already in list alert user
      alert('Username already exists.');
      event.preventDefault(); //prevent default submit which reloads page
    } else if (!(/^[a-zA-Z0-9_]{3,25}$/.test(inputValue))) { //If username is invalid alert user
      alert('Invalid Twitch username entered.');
      event.preventDefault(); //prevent default submit which reloads page
    };
  });

  //before closing or refreshing update the cookie with the most recent usernameList
  window.addEventListener("beforeunload", function() {
    Streamers.saveToCookie();
  }, false);

});
