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
    var suggestion, suggestions, tagsCounter, caseTags,i,p,result=[],obj={};
    caseTags = req.body.suggestions
    await fs.readFile('server/tmp/suggestions.json', function (err,data) {
        if (err) throw err;
        suggestion = JSON.parse(data);
        suggestions = suggestion.suggestions
        // suggestions = Array.from(new Set(suggestions.concat(caseTags)))
        for(i=0;i<suggestions.length;i++)obj[suggestions[i].id]=suggestions[i].text;
        for(i=0;i<caseTags.length;i++)obj[caseTags[i].id]=caseTags[i].text;
        for(p in obj)if(obj.hasOwnProperty(p))result.push({id:p,text:obj[p]});
        suggestion.suggestions = result;
       
        try{
            fs.writeFileSync('server/tmp/suggestions.json',JSON.stringify(suggestion))
            res.send(200, "Suggestions saved successfully")
        }catch(err){
            console.log(err);
            res.send(500, err,"Something went wrong");
        }
    });

    await fs.readFile('server/tmp/tagsCounter.json', function (err,data) {
        if (err) throw err;
        tagsCounter = JSON.parse(data);
        for(i=0; i<caseTags.length; i++){
            if(tagsCounter.hasOwnProperty(caseTags[i].id)){
                tagsCounter[caseTags[i].id] += 1;
            }else{
                tagsCounter[caseTags[i].id] = 1;
            }
        }
        fs.writeFileSync('server/tmp/tagsCounter.json', JSON.stringify(tagsCounter));
    });
    
    
})