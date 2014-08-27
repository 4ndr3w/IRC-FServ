var fs = require('fs'),
    path = require('path'),
    diff = require('deep-diff'),
    _ = require("underscore");

var mounts = JSON.parse(fs.readFileSync("mounts.json"));

var tree = new Object();

function buildFS(t, path)
{
  var items  = fs.readdirSync(path);
  for ( i in items )
  {
      if ( items[i][0] != "." )
      {
        var stat = fs.lstatSync(path+"/"+items[i]);
        if ( stat.isDirectory() )
        {
            t[items[i]] = new Object();
            buildFS(t[items[i]], path+"/"+items[i]);
        }
        else
        {
          t[items[i]] = path+"/"+items[i];
        }
      }
  }
}

exports.newFiles = new Array();
exports.tree = tree;
var isFirstRun = true;
exports.refresh = function()
{
  var oldtree = _.clone(exports.tree);
  for ( t in exports.tree )
  {
    delete exports.tree[t];
  }

  mounts = JSON.parse(fs.readFileSync("mounts.json"));
  for ( m in mounts )
  {
    tree[m] = new Object();
    buildFS(tree[m], mounts[m]);
  }

  exports.newFiles = new Array();
  if ( !isFirstRun )
  {
    console.log(tree);
    console.log(oldtree);
    var result = diff(tree, oldtree);
    console.log(result);
    for ( r in result )
    {
      if ( result[r].kind == "D")
        exports.newFiles.push(result[r].path.join("/"));
    }
    console.log(exports.newFiles);
  }
  isFirstRun = false;
};

exports.refresh();
