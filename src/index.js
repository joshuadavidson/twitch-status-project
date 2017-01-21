/* establish global variables for ESLint */
/* global $ document window */

// Set a cookie with supplied name, value, and expiry
function setCookie(cookieName, cookieValue, expiryDays) {
  // If not expiry given make the cookie never expire
  if (expiryDays === undefined) {
    document.cookie = `${cookieName}=${cookieValue}; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
  }
  // else set the expiry date based on passed value
  else {
    const date = new Date();
    date.setTime(date.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    document.cookie = `${cookieName}=${cookieValue}; expires=${date.toUTCString()}`;
  }
}

// get the value of a cookie with cookieName
function getCookieValue(cookieName) {
  const cookieNameLookup = `${cookieName}=`;
  const allCookies = document.cookie.split(';');
  for (let i = 0; i < allCookies.length; i += 1) {
    const currentCookie = allCookies[i];
    if (currentCookie.indexOf(cookieNameLookup) === 0) {
      return currentCookie.substring(cookieName.length, currentCookie.length);
    }
  }
  return '';
}

// function constructor for channel objects
class Channel {
  constructor(username) {
    this.username = username;
    // set up empty object for Twitch channel data
    this.channelJSON = {};
    // set up empty object for Twitch user data
    this.userJSON = {};
    this.html = '';
  }

  // method that returns ajax promise to retrieve channel info bound to channel object
  getChannelInfo() {
    // ensure that the Channel object is visible within the ajax promise
    const self = this;
    // return the ajax promise
    return $.ajax({
      url: `https://api.twitch.tv/kraken/streams/${self.username}`,
      data: {
        client_id: '9gqb16o5nkdypg2smko1jqmipl2hg0l',
      },
      dataType: 'jsonp',
      type: 'GET',
    });
  }

  // method that returns ajax promise to retrieve user info bound to channel object
  getUserInfo() {
    // ensure that the Channel object is visible within the ajax promise
    const self = this;
    // return the ajax promise
    return $.ajax({
      url: `https://api.twitch.tv/kraken/users/${self.username}`,
      data: {
        client_id: '9gqb16o5nkdypg2smko1jqmipl2hg0l',
      },
      dataType: 'jsonp',
      type: 'GET',
    });
  }

  // method to get Twitch data asynchronously by using a promise
  getTwitchData() {
    // ensure that the Channel object is visible within the promise
    const self = this;
    // crate a promise that will ensure both ajax requests complete
    return new Promise((resolve, reject) => {
      // use all to run both promises in parallel
      Promise.all([
        self.getChannelInfo(),
        self.getUserInfo(),
      ])
      // when both of the above promises complete, update data and resolve the getTwitchData promise
      .then((twitchData) => {
        // save the twitch data to the channel object.
        self.channelJSON = twitchData[0];
        // save the twitch data to the channel object.
        self.userJSON = twitchData[1];
        // generate the HTML for the page
        self.getHTML();
        // return the channel object once resolved
        resolve(self);
      })
      // if either of the above promises error, throw the error
      .catch((err) => {
        // if there is an error return the error
        reject(err);
      });
    });
  }

  // method to generate the HTML needed for each channel
  getHTML() {
    // get the online state of the user, if stream exists
    const state = this.channelJSON.stream ? 'online' : 'offline';
    // show the default twitch icon if no logo is present
    const logoURL = this.userJSON.logo || './img/GlitchIcon_white.png';
    // generate the channel url by appending username to twitch.tv
    const channelURL = `https://www.twitch.tv/${this.username}`;
    // if the user has a display name use it other wise use the typed in username
    const displayName = this.userJSON.display_name || this.username;
    // status to display
    let status = null;

    // if valid user but not streaming show status offline
    if (this.channelJSON.stream === null) {
      status = 'Offline';
    }
    // if user is not valid show message from Twitch
    else if (this.channelJSON.stream === undefined) {
      status = this.channelJSON.message;
    }
    else {
      status = `${this.channelJSON.stream.channel.game}:${this.channelJSON.stream.channel.status}`;
    }

    // generate the html for the stream row
    this.html = `<div class="row stream-row">
          <div class="col-xs-2 text-center">
            <a href="${channelURL}" target="_blank">
              <img class="profile-img ${state}" src="${logoURL}" />
            </a>
          </div>

          <div class="col-xs-2 col-xs-push-8 text-center icon-vcenter">
            <i class="delete-icon fa fa-minus-square fa-2x" title="Delete User" aria-hidden="true"></i>
          </div>

          <div class="col-sm-3 col-xs-8 col-xs-pull-2 text-left text-vcenter">
            <span class="username">
              <i class="user-icon fa fa-user fa-lg" title="Username" aria-hidden="true"></i>
              <a href="${channelURL}" target="_blank">
                ${displayName}
              </a>
            </span>
          </div>

          <div class="col-sm-5 col-xs-8 col-xs-pull-2 text-left text-vcenter">
            <i class="game-icon fa fa-gamepad fa-lg" title="Status" aria-hidden="true"></i>
            <span class="status">${status}</span>
          </div>
        </div>`;

    // As soon as HTML is generated show it on the page
    $('#status-block').prepend(this.html);

    return this.html;
  }
}

// Main object for Twitch data
const Streamers = {
  usernameList: [],
  channelList: [],
  twitchDataPromiseList: [],

  // set up the Streamers object
  initialize() {
    // ensure that the Streamers object is visible within the promise
    const self = this;
    return new Promise((resolve, reject) => {
      // Get previous list of usernames
      if (getCookieValue('usernameList') !== '') {
        self.usernameList = getCookieValue('usernameList').split(',');
      }
      // Use default list
      else {
        self.usernameList = ['ESL_SC2', 'freecodecamp', 'jwaynedavidson'];
        setCookie('usernameList', self.usernameList);
      }

      // populate the channelList array with blank channel objects from the usernameList
      for (const username of self.usernameList) {
        self.channelList.push(new Channel(username));
      }

      // create an array of promises to be executed to get Twitch data
      // fetch all of the twitch data simultaneously and wait for all to resolve
      Promise.all(self.channelList.map(channel => channel.getTwitchData()))
      .then((values) => {
        // when done return an array containing each channel object
        resolve(values);
      })
      .catch((err) => {
        // if there is an error return the error
        reject(err);
      });

      // make methods chainable
      return self;
    });
  },

  // function to add a username
  addUser(username) {
    // add the username to the usernameList
    this.usernameList.unshift(username);
    // add the empty channel to the channeList
    this.channelList.unshift(new Channel(username));

    this.channelList[0].getTwitchData()
    .catch((err) => {
      console.log(err);
    });
  },

  // function to remove username
  removeUser(username) {
    const usernameIndex = this.findUsernameIndex(username);
    const channelIndex = this.findChannelIndex(username);

    // if username was found remove it from the list
    if (usernameIndex >= 0) {
      this.usernameList.splice(usernameIndex, 1);
    }

    // if channel with given username is found remove it from the list
    if (channelIndex >= 0) {
      this.channelList.splice(channelIndex, 1);
    }
  },

  // function to take username and return usernameList index, -1 if DNE
  findUsernameIndex(username) {
    // find the index of the username in the list
    return this.usernameList.findIndex(value => username.toLowerCase() === value.toLowerCase());
  },

  // function to take username and return channelList index, -1 if DNE
  findChannelIndex(username) {
    for (let i = 0; i < this.channelList.length; i += 1) {
      if (this.channelList[i].username.toLowerCase() === username.toLowerCase()) {
        return i;
      }
    }
    return null;
  },

  saveToCookie() {
    setCookie('usernameList', this.usernameList);
    // make methods chainable
    return this;
  },
};

$(document).ready(() => {
  // initialize the Streamers object and pull data from Twitch
  Streamers.initialize()
  .catch((err) => {
    console.log(err);
  });

  // Delete stream when user clicks on delete-icon
  $('#status-block').on('click', '.delete-icon', function onClick() {
    // find the username in the div
    const username = $(this).parent().parent().find('span > a')
      .html();
    // remove the user from the Streamers object
    Streamers.removeUser(username);
    // remove the row from the html
    $(this).parent().parent().remove();
  });

  // add a user via the form
  $('#username-form').submit(function onSubmit(event) {
    // store the input from the input box
    const inputValue = document.getElementById('username-input').value;
    // check to see if username is valid Twitch username and not in list
    if (/^[a-zA-Z0-9_]{3,25}$/.test(inputValue) && Streamers.findUsernameIndex(inputValue) === -1) {
      // add the user
      Streamers.addUser(inputValue);
      // clear the form after submitting
      this.reset();
      // prevent default submit which reloads page
      event.preventDefault();
    }
    // If username is already in list alert user
    else if (Streamers.findUsernameIndex(inputValue) !== -1) {
      window.alert('Username already exists.');
      // prevent default submit which reloads page
      event.preventDefault();
    }
    // If username is invalid alert user
    else if (!(/^[a-zA-Z0-9_]{3,25}$/.test(inputValue))) {
      window.alert('Invalid Twitch username entered.');
      // prevent default submit which reloads page
      event.preventDefault();
    }
  });

  // before closing or refreshing update the cookie with the most recent usernameList
  window.addEventListener('beforeunload', () => {
    Streamers.saveToCookie();
  }, false);
});
