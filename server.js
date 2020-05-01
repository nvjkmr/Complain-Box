const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
var cors = require('cors');
const flash = require('express-flash')
const session = require('express-session')
var MemoryStore = require('memorystore')(session)
const methodOverride = require('method-override')
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fetch = require('node-fetch');


const UserModel = require("./models/user");
const ComplainModel = require("./models/complain");
mongoose.connect(
    "uri", {
        useUnifiedTopology: true,
        useNewUrlParser: true
    }
);
mongoose.set('useFindAndModify', false);
const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

let users = [];
UserModel.find({}, (err, docs) => {
    if (!err) {
        for (var i = 0; i < docs.length; i++) {
            users.push(docs[i]);
        }
    }
});
app.use(cors());
app.use(express.static("public"));
app.set('view-engine', 'ejs')
app.use(express.urlencoded({
    extended: false
}))
app.use(flash())
app.use(session({
    cookie: {maxAge: 86400000},
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
//app.use(passport.session())
app.use(methodOverride('_method'))
//=====================================================================================================================

app.post('/getStat', checkAuthenticated, (req,res)=>{
  var pendingno=0;
  var activeno=0;
  var resolvedno=0;
  ComplainModel.find({
        name: req.user.name,
        email: req.user.email,
        er_no: req.user.er_no
  },(err,docs)=>{
      if(!err){
        for(var i=0;i<docs.length;i++){
          if(docs[i].status==1){
            pendingno++;
          }
          else if(docs[i].status==2){
            activeno++;
          } 
          else if(docs[i].status==3){
            resolvedno++;
          }
        }
      }
      var toReturnStat = [{"pendingno":pendingno},{"activeno":activeno},{"resolvedno":resolvedno}];
      console.log(toReturnStat)
      res.send(JSON.stringify(toReturnStat));      
  })
});



app.post('/postComplain', checkAuthenticated, (req, res) => {
    var complain_topic = req.body.complain_topic;
    var complain = req.body.complain;
    ComplainModel.create({
        name: req.user.name,
        email: req.user.email,
        start_date: Date.now(),
        er_no: req.user.er_no,
        status: 1,
        complain_topic: complain_topic,
        complain: complain
    }, (err, docs) => {
        if (!err) {
            res.redirect("/");
        }
    })
})

// returns all complains.....
app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs')
})

app.post('/showPending', checkAuthenticated, (req, res) => {
    ComplainModel.find({
        name: req.user.name,
        email: req.user.email,
        er_no: req.user.er_no,
        status: 1
    }, (err, docs) => {
        if (!err && docs.length) {
            var dataToReturn=[];
            dataToReturn = docs;
            console.log(dataToReturn);
            res.send(JSON.stringify(dataToReturn));
        }
        else if(!err)
        {
          var dataToReturn=[];
          res.send(JSON.stringify(dataToReturn));
        }
    })
})


app.post('/showActive', checkAuthenticated, (req, res) => {
    ComplainModel.find({
        name: req.user.name,
        email: req.user.email,
        er_no: req.user.er_no,
        status: 2
    }, (err, docs) => {
        if (!err && docs.length) {
            var dataToReturn =[];
            dataToReturn= docs;
            res.send(JSON.stringify(dataToReturn));
        }
        else if(!err)
        {
          var dataToReturn=[];
          res.send(JSON.stringify(dataToReturn));
        }
    })
})

app.post('/showResolved', checkAuthenticated, (req, res) => {
    ComplainModel.find({
        name: req.user.name,
        email: req.user.email,
        er_no: req.user.er_no,
        status: 3
    }, (err, docs) => {
        if (!err && docs.length) {
            var dataToReturn =[];
            dataToReturn= docs;
            res.send(JSON.stringify(dataToReturn));
        }
        else if(!err)
        {
          var dataToReturn=[];
          res.send(JSON.stringify(dataToReturn));
        }
    })
})

app.post('/convertToResolved', checkAuthenticated, (req, res) => {
    var complain_topic = req.body.complain_topic;
    var complain = req.body.complain;
    var updateDoc = {
        "status": 3,
        "end_date":Date.now()
    };
    ComplainModel.findOneAndUpdate({
        name: req.user.name,
        email: req.user.email,
        er_no: req.user.er_no,
        complain_topic: complain_topic,
        complain: complain,
    }, {$set:updateDoc}, (err, docs) => {
        if (!err) {
            res.send("marked as resolved")
        }
    })
})

//*****************************************************************ADMIN*************************************************************************
app.get('/buyCoffee',(req,res)=>{
  res.render('buyCoffee.ejs');
});
// admin login page
var adminflag = 0;
app.get('/admin/login', (req, res) => {
  if(adminflag===0){
    res.render('adminLogin.ejs');
  }
  else if(adminflag===1){
    res.redirect('/admin/dashboard');
  }
});

app.get('/admin/logout',(req,res)=>{
  adminflag=0;
  res.redirect('/admin/login');
})

app.post('/admin/login', (req, res) => {
    let secret_login_key = req.body.secret_login_key;
    if (secret_login_key == 'aezakmi') {
        adminflag = 1;
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/admin/login');
    }
});

app.get('/admin/showPending', (req, res) => {
    if (adminflag === 1) {
        ComplainModel.find({
            status: 1
        }, (err, docs) => {
            if (!err && docs.length) {
                var dataToReturn = docs;
                res.send(dataToReturn);
            }
        })
    } else {
        res.redirect('/admin/login');
    }
})

app.post('/admin/showActive', (req, res) => {
    if (adminflag === 1) {
        ComplainModel.find({
            status: 2
        }, (err, docs) => {
            if (!err && docs.length) {
                var dataToReturn = docs;
                res.send(dataToReturn);
            }
        })
    } else {
        res.redirect('/admin/login');
    }
})

app.get('/admin/dashboard', (req, res) => {
    if (adminflag === 1) {
        res.render('adminDashboard.ejs');
    } else {
        res.redirect('/admin/login');
    }
})
app.post('/convertToActive', (req, res) => {
    if (adminflag === 1) {
        var complain_topic = req.body.complain_topic;
        var complain = req.body.complain;
        var complainer_email = req.body.complainer_email;
        var complainer_name = req.body.complainer_name;
        var complainer_er_no = req.body.complainer_er_no;
        var updateDoc = {
            "status": 2
        };
        ComplainModel.findOneAndUpdate({
            name: complainer_name,
            email: complainer_email,
            er_no: complainer_er_no,
            complain_topic: complain_topic,
            complain: complain,
            status: 1
        }, {
            $set: updateDoc
        }, (err, docs) => {
            if (!err) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        credentials
                        
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });
                var mailOptions = {
                    from: "Complain_Box<complain.box.mailer@gmail.com>",
                    to: complainer_email.toLowerCase().trim(),
                    subject: 'Your complain has been accepted',
                    text: 'Hello ' + complainer_name + ',\n\n\nYour Complain ' + complain_topic + ' has been accepted by the authorities and is under process to get resolved\n\nWe hope your complain gets solved ASAP!😃\n\n\nRegards,\nTeam Complain_Box😃'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    if (err) console.log(err)
                    else console.log("Mail sent")
                });
                res.send("active");
            }
        })
    } else {
        red.redirect('/admin/login');
    }
})



//=====================================================================================================================
app.get('/forgotPassword', (req, res) => {
    res.render('forgotPassword.ejs');
});

app.post('/forgotPassword', (req, res) => {
    var recoveryId = crypto.randomBytes(3).toString('hex');
    var name;
    var email = req.body.email;
    UserModel.find({
        email: email
    }, (err, docs) => {
        if (!err && !docs.length) {
            res.redirect('/forgotPassword');
        } else if (!err && docs.length) {
            name = docs[0].name;
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    credentials
                    
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            var mailOptions = {
                from: "Complain_Box<complain.box.mailer@gmail.com>",
                to: req.body.email.toLowerCase().trim(),
                subject: 'Verify your account!',
                text: 'Hello ' + name + ',\n\n\nHope you are doing well!\n\nYour account recovery key: ' + recoveryId + '\n\n\nRegards,\nTeam Complain_Box😃'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                if (err) console.log(err)
                else {
                    console.log("Mail sent")
                    res.redirect('/enterRecoveryKey')
                    app.get('/enterRecoveryKey', (req, res) => {
                        res.render('recoveryKey.ejs');
                    })
                    app.post('/enterRecoveryKey', (req, res) => {
                        var recoveryKeyEntered = req.body.recoveryKeyEntered;
                        if (recoveryId != recoveryKeyEntered) {
                            res.redirect('/forgotPassword');
                        } else if (recoveryId == recoveryKeyEntered) {
                            res.redirect('/changePassNow');
                            app.get('/changePassNow', (req, res) => {
                                res.render('changePassNow.ejs');
                            })
                            app.post('/changePassNow', async (req, res) => {
                                var newPass1 = req.body.newPass1;
                                var newPass2 = req.body.newPass2;
                                if (newPass2 != newPass1) {
                                    res.redirect('/forgotPassword')
                                } else if (newPass2 == newPass1) {
                                    const hashedPassword = await bcrypt.hash(req.body.newPass1, 10)
                                    var toChange = {
                                        password: hashedPassword
                                    };
                                    UserModel.findOneAndUpdate({
                                        email: email,
                                        name: name
                                    }, {
                                        $set: toChange
                                    }, (err, docs) => {
                                        if (!err) {
                                            var smtpTransport = nodemailer.createTransport({
                                                service: 'Gmail',
                                                auth: {
                                                    credentials
                                                    
                                                },
                                                tls: {
                                                    rejectUnauthorized: false
                                                }
                                            });
                                            var mailOptions = {
                                                from: "Complain_Box<complain.box.mailer@gmail.com>",
                                                to: email.toLowerCase().trim(),
                                                subject: 'Password updated sucessfully😃',
                                                text: 'Hello ' + name + ',\n\n\nYour account password has been updated!😃\n\n\nRegards,\nTeam Complain_Box😃'
                                            };
                                            smtpTransport.sendMail(mailOptions, function(err) {
                                                if (err) console.log(err)
                                                else console.log("Mail sent")
                                            });
                                            res.redirect('/login');
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            });
        }
    })
})



app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            er_no: req.body.erno
        })
        const userr = new UserModel({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            er_no: req.body.erno
        });
        try {
            await userr.save();
        } catch (err) {
            res.status(500).send(err);
        }
        var smtpTransport = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                credentials
                
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        var mailOptions = {
            from: "Complain_Box<complain.box.mailer@gmail.com>",
            to: req.body.email.toLowerCase().trim(),
            subject: 'Welcome to Complain_Box!',
            text: 'Hello ' + req.body.name + ',\n\n\nHope you are doing well!\n\nThankyou for registering on Complain_Box!\n\nWe hope you get all your problems solved here 😃\n\n\nRegards,\nTeam Complain_Box😃'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
            if (err) console.log(err)
            else console.log("Mail sent")
        });
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
})

app.get('/logout', (req, res) => {
    var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            credentials
            
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    var mailOptions = {
        from: "Complain_Box<complain.box.mailer@gmail.com>",
        to: req.user.email.toLowerCase().trim(),
        subject: 'BYE! see you soon',
        text: 'Hello ' + req.user.name + ',\n\n\nWe hope we serviced you well! See you soon!\n\nGood Bye! 😃\n\n\nRegards,\nTeam Complain_Box😃'
    };
    smtpTransport.sendMail(mailOptions, function(err) {
        if (err) console.log(err)
        else console.log("Mail sent")
    });
    req.logOut()
    res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.status(200).redirect('/')
    }
    next()
}



app.listen(process.env.PORT)
