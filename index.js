var options = JSON.parse(require("fs").readFileSync("config.json"));

var IRC = require("./irc");
var PMSession = require("./PMSession").session;
var sessions = require("./PMSession").sessionList;
var c = new IRC(options);
var index = require("./fsindex");
var tree = index.tree;
c.on("cmd-!dl", function(channel,user, full, args)
{
  console.log("exec");
  if ( !sessions.has(user) )
    new PMSession(c, user);
});


c.on("cmd-!test", function(channel)
{
 c.privmsg(channel, "I am a bot");
});

c.on("cmd-!refresh", function(channel, user, full, args)
{
  index.refresh();
  c.privmsg(channel, index.newFiles.length+" files have been added");
  for ( i in index.newFiles )
  {
    c.privmsg(channel, "New file: "+index.newFiles[i]);
  }
});

c.on("cmd-!new", function(channel, user, full, args)
{
  c.privmsg(channel, index.newFiles.length+" files have been added");
  for ( i in index.newFiles )
  {
    c.privmsg(channel, "New file: "+index.newFiles[i]);
  }
});

c.on("cmd-!search", function(channel, user, full, args)
{
  var results = index.search(full.substr(1));
  if ( results.length > 0 )
  {
    c.notice(user, "Found "+results.length+" items");
    c.privmsg(user, "\"/msg "+options.nick+" DL #\" to start download");
    for ( r in results )
    {
      c.privmsg(user, "#"+results[r].index+" - "+results[r].name);
    }
  }
  else
    c.notice(user, "No results found");
});

c.on("cmd-DL", function(channel, user, full, args)
{
	if ( channel == options.nick )
	{
		try {
			var entry = index.files[parseInt(args[1])];
			if ( !entry )
				c.privmsg(user, "Invalid Request");
			else if ( c.sendFile(user, entry.path) )
				c.privmsg(user, "Transfer started");
			else
				c.privmsg(user, "All slots are currently full. Try again later.");
		} catch(e){}
	}
});
