var fsIndex = require("./fsindex").tree;
var List = require("collections/list");


function PMSession(irc, nick)
{
  exports.sessionList.push(nick);
  var thisPtr = this;
  this.numMap = new Array();
  this.position = fsIndex;
  this.nick = nick;
  this.activitySinceLastCheck = false;

  this.activityTimer = setInterval(function()
  {
    if ( !thisPtr.activitySinceLastCheck )
    {
      irc.privmsg(thisPtr.nick, "Session Timeout");
      irc.removeListener(thisPtr.nick, thisPtr.listener);
      exports.sessionList.delete(thisPtr.nick);
      clearInterval(thisPtr.activityTimer);
    }
    thisPtr.activitySinceLastCheck = false;
  }, 60000);

  this.generateMenu = function()
  {
    this.numMap = new Array();
    irc.privmsg(this.nick, "0 - Home");
    for ( f in this.position )
    {
      this.numMap.push(f);
      irc.privmsg(this.nick, this.numMap.length+" - "+f);
    }
  };


  irc.privmsg(nick, "The following mounts are available: ");
  this.generateMenu();

  this.listener = function(user, msg, args)
  {
    thisPtr.activitySinceLastCheck = true;
    var choice = parseInt(args[0]);
    if ( choice == 0 )
    {
      thisPtr.position = fsIndex;
    }
    else if ( choice > 0 && choice <= thisPtr.numMap.length )
    {
      var last = thisPtr.position;
      thisPtr.position = thisPtr.position[thisPtr.numMap[choice-1]];
      if ( typeof thisPtr.position == "string" )
      {
        var path = thisPtr.position;
        if ( irc.sendFile(thisPtr.nick, path) )
        {
          irc.privmsg(thisPtr.nick, "Sending File...");
          thisPtr.position = fsIndex;
        }
        else
        {
          irc.privmsg(thisPtr.nick, "There aren't any open slots! Try again later.");
          thisPtr.position = last;
        }
       }
      }
      else
      {
        irc.privmsg(thisPtr.nick, "Invalid Option");
      }

      irc.privmsg(thisPtr.nick, "Directory Listing:");
      thisPtr.generateMenu();
  }

  irc.on(this.nick, this.listener);
  return this;
}

exports.session = PMSession;
exports.sessionList = List();
