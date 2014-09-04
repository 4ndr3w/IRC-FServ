var fs = require('fs'),
    path = require('path'),
    diff = require('deep-diff'),
    _ = require("underscore");

var mounts = JSON.parse(fs.readFileSync("mounts.json"));
var files = new Array();
var tree = new Object();

var threshForMatch = 3;
function search(terms)
{
  console.log("searching for "+terms);
  terms = terms.split(" ");
  if ( terms.length < 2 )
    return [];
  var results = new Array();
  for ( f in files )
  {
    var matches = 0;
    for ( t in terms )
    {
      if ( files[f].name.toLowerCase().indexOf(terms[t].toLowerCase()) != -1 )
      {
        matches++;
      }
    }
    if ( matches >= threshForMatch )
    {
      files[f].index = f;
      console.log("pushing match");
      results.push(files[f]);
    }
  }
  console.log(results);
  return results;
}
exports.search = search;

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
          files.push({name:items[i], path:path+"/"+items[i]});
          t[items[i]] = path+"/"+items[i];
        }
      }
  }
}

exports.newFiles = new Array();
exports.tree = tree;
exports.files = files;
var isFirstRun = true;
exports.refresh = function()
{
  var oldtree = _.clone(exports.tree);
  for ( t in exports.tree )
  {
    delete exports.tree[t];
  }
  for ( t in exports.files )
  {
	exports.files.pop();
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
