const express=require('express');
const app=express();
const mysql=require('mysql');
const bodyParser=require('body-parser');
const session=require('express-session');

app.use(express.static('public'));

app.use(bodyParser.json());
app.set('view engine',"ejs");
app.use(express.urlencoded({extended:true}));

const conn=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'node_restapi'
})

conn.connect((err)=>{
    if(err)throw err;
    console.log('MySQL connected');
})

app.use(session({
    secret:'secret',
  resave:true,
  saveUninitialized:true
}))

app.get("/",(req,res)=>{
    if(req.session.loggedin){
        let sqlQuery="SELECT * FROM tweets"
        let query=conn.query(sqlQuery,(err,results)=>{
            res.render("home",{results,username:req.session.username});
        })
    }
    else{
        res.render('login');
    }
    
})

app.post('/logout',(req,res)=>{
    req.session.loggedin=false;
    req.session.username=null;
    res.redirect('/');
})

app.get('/api/items',(req,res)=>{
    let sqlQuery="SELECT * FROM tweets";
    let query=conn.query(sqlQuery,(err,results)=>{
        if(err)throw err;
        // res.send(results);
        res.render('show',{results,username:req.session.username});
    })
})

app.get('/api/items/:id',(req,res)=>{
    let sqlQuery="SELECT * FROM tweets WHERE id = "+req.params.id+ " LIMIT 1";
    let query=conn.query(sqlQuery,(err,results)=>{
        // console.log(results);
        // res.json({results});
        res.render("tweet", {results,username:req.session.username})
    })
})

app.get('/create',(req,res)=>{
    let username=req.session.username;
    res.render('create',{username});
})

app.get('/find',(req,res)=>{
    let sqlQuery=`SELECT * FROM tweets WHERE createdUser = "${req.session.username}"`;
    let query=conn.query(sqlQuery,(err,results)=>{
        res.render("show", {results,username:req.session.username})
    })
})

app.post('/create',(req,res)=>{
    let data={title:req.body.title, body:req.body.description, createdUser:req.session.username};
    let sqlQuery="INSERT INTO tweets SET ?";
    let query=conn.query(sqlQuery,data,(err,results)=>{
        if(err)console.log(err);
        else res.redirect('/');
    })
})

app.post('/api/delete/:id',(req,res)=>{
    let sqlQuery="DELETE FROM tweets WHERE id = "+req.params.id;
    let query=conn.query(sqlQuery,(err,results)=>{
        if(err)console.log(err);
        res.redirect('/');
    })
})

app.get('/api/edit/:id',(req,res)=>{
    let username=req.session.username;
    let id=req.params.id;
    res.render('edit',{username,id});
})

app.post('/edit/:id',(req,res)=>{
    let title=req.body.title;
    let body=req.body.description;
    let sqlQuery=`UPDATE tweets set title="${title}" , body= "${body}" where id = `+req.params.id;
    let query=conn.query(sqlQuery,(err,results)=>{
        if(err)console.log(err);
    })
    sqlQuery=`SELECT * FROM tweets WHERE createdUser = "${req.session.username}"`;
    query=conn.query(sqlQuery,(err,results)=>{
        res.render("show", {results,username:req.session.username})
    })
})


app.post('/auth',(req,res)=>{
    let username=req.body.user;
    let password=req.body.password;
    if(username && password){
      let sqlQuery='SELECT * FROM userauth  WHERE username =? AND password= ?';
      conn.query(sqlQuery,[username,password],(err,results)=>{
        if(err) throw err;
        if(results.length>0){
          req.session.loggedin=true;
          req.session.username=username;
          res.redirect('/');
        }
        else{
            res.send('Incorrect Username and password');
        }
        res.end();
      })
    }
    else{
        res.send('Please enter the username and password');
      res.redirect("/");
    }
  })

app.listen(5000,function(req,res){
    console.log("Connected to port 5000");
})