var express = require('express');
var app = express();
var cors = require('cors');
var fs = require('fs');
var bodyParser = require('body-parser');

app.listen(4000,(req,res)=>{
  console.log("Server running on port 4000...")  
})

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }))
 
app.use(bodyParser.json())

app.get("/suggestions",async function(req,res){
    var obj,suggestions;
    try{   
        await fs.readFile('server/tmp/suggestions.json', function (err,data) {
            if (err) throw err;
            obj = JSON.parse(data);
            suggestions = obj.suggestions
            res.send(suggestions)
        });
    }catch(err){
        console.log(err);
        res.send(err,"Something went wrong");
    }
})

app.post("/suggestions",async function(req,res){
    var obj;
    await fs.readFile('server/tmp/suggestions.json', function (err,data) {
        if (err) throw err;
        obj = JSON.parse(data);
        suggestions = obj.suggestions
    });
    console.log(req.body)
    var data = JSON.stringify(req.body)
    console.log(data);
    try{
        await fs.writeFileSync('server/tmp/suggestions.json',data)
        res.send(200, "Suggestions saved successfully")
    }catch(err){
        console.log(err);
        res.send(500, err,"Something went wrong");
    }
})