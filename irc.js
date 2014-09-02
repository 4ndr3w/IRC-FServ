var net = require("net"),
    tls = require("tls");
var DCC = require("./dcc-session"),
    fs = require("fs"),
    path = require("path");
var EventEmitter = require("events").EventEmitter;

var IRC = function(options)
{
  var nick = options.nick;
  var server = options.host;
  var port = options.port;
  var channels = options.channels;
  DCC.setIP(options.publicIP);
  if ( nick == undefined )
    nick = "FSBot";

  if ( !Array.isArray(channels) && channels != undefined )
    channels = new Array(channels);
  this.channels = channels;
  this.botnick = nick;
  if ( this.channels == undefined )
    this.channels = new Array();

  var client = tls.connect(port, server, {rejectUnauthorized:false}, function()
  {
    if ( options.password )
    	client.write("PASS "+options.password+"\n");
    client.write("NICK :"+nick+"\n");
    client.write("USER "+nick+" "+nick+" "+nick+" :"+nick+"\n");
  });

  this.userParse = function(user)
  {
    var out = new Object();
    user = user.substr(1);
    sep =  user.indexOf("!");
    out.nickname = user.substr(0,sep)
    user = user.substr(sep+1, user.length);
    out.username = user.substr(user, user.indexOf("@"));
    out.hostname = user.substr(user.indexOf("@")+1, user.length);
    return out;
  }

  this.handleLine = function(line)
  {
    line = line.replace("\r", "");
    var full = line;
    var line = line.split(" ");
    switch ( line[0] )
    {
      case "PING":
        this.write("PONG "+line[1]);
    }

    switch ( line[1] )
    {
      case "376":
        for ( c in this.channels )
        {
          this.join(this.channels[c]);
        }
        break;
      case "PRIVMSG":
        var msg = full.slice(full.indexOf(":",1)+1, full.length);
        var args = msg.split(" ");
        var user = this.userParse(line[0]).nickname;
        if ( line[2] == this.botnick )
          line[2] = user;
        console.log(line[2]);
        this.emit(line[2], user, msg, args);
        if ( line[2][0] == '#' )
          this.emit("channelmsg", line[2], user, msg, args);
        this.emit(line[2]+"-"+user, line[2], user, msg, args);
        this.emit("cmd-"+args[0], line[2], user, msg, args);
        break;
    }
  };

  var dataBuf = "";
  var thisPtr = this;
  client.on("data", function(chunk)
  {
    dataBuf += chunk.toString();
    var i;
    while ( (i = dataBuf.indexOf("\n")) != -1 )
    {
      var line = dataBuf.slice(0, i);
      thisPtr.handleLine(line);
      console.log(line);
      dataBuf = dataBuf.slice(i+1, dataBuf.length+1);
    }
  });


  this.privmsg = function(target, msg)
  {
    this.write("PRIVMSG "+target+" :"+msg);
  };

  this.notice = function(target, msg)
  {
    this.write("NOTICE "+target+" :"+msg);
  };

  this.ctcp = function(user, msg)
  {
    var ctcpchar = new Buffer(1);
    ctcpchar.writeUInt8(1,0);
    ctcpchar = ctcpchar.toString();
    this.write("PRIVMSG "+user+" :"+ctcpchar+msg+ctcpchar);
  };

  this.join = function(channel)
  {
    this.write("JOIN :"+channel);
  };

  this.write = function(msg)
  {
    console.log("-> "+msg);
    client.write(msg+"\n");
  };

  this.sendFile = function(user, file)
  {
    var d = DCC.sendFile(file);
    if ( d )
    {
      stats = fs.statSync(file);
      return thisPtr.ctcp(user, "DCC SEND \""+path.basename(file)+"\" "+d.getIPLong()+" "+d.getPort()+" "+stats.size);
    }
  };

  return this;
}
IRC.prototype.__proto__ = EventEmitter.prototype;
module.exports = IRC;
