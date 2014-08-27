var net = require("net"),
    ip = require("ip"),
    fs = require("fs");

var EventEmitter = require("events").EventEmitter;

var myIP = 0;

exports.setIP = function(addr)
{
	myIP = ip.toLong(addr);
};

var availablePorts = [8080,8081,8082,8083,8084];

var DCC = function(file, port)
{
  var thisPtr = this;
  this.server = net.createServer(function(s) {

  });
  this.server.listen(port, function() {

  });

  this.server.on("connection", function(client)
  {
    clearTimeout(thisPtr.timeoutTimer);
    fs.createReadStream(file).pipe(client);
    client.on("error", function(err) {});
    client.on("close", function(err)
    {
      thisPtr.server.close();
      thisPtr.emit("done");
    });
  });
  this.server.on("error", function(err) {});

  this.getPort = function()
  {
    return port;
  };

  this.getIPLong = function()
  {
    return myIP;
  };


  this.timeoutTimer = setTimeout(function()
  {
    try
    {
      thisPtr.server.close();
    } catch(e) {}
    thisPtr.emit("timeout");
    thisPtr.emit("done");
  }, 10000);
}

DCC.prototype.__proto__ = EventEmitter.prototype;
exports.DCC = DCC;



exports.sendFile = function(file)
{
  if ( availablePorts.length == 0 )
    return false;
  var port = availablePorts.shift();
  var c = new DCC(file, port);
  c.on("done", function()
  {
    availablePorts.unshift(this.getPort());
  });
  return c;
};
