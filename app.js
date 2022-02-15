const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note }} = require('./db');
const path = require('path');

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/users/:id/notes', async(req, res, next) => {
  try{
    //console.log(req.headers)
    const user = await User.byToken(req.headers.authorization)

    if(user.id === req.params.id){
      const user = await User.findByPk(req.params.id, {include: Note})

      console.log(user);
      res.send(user.notes);
    }else{
      res.send('Not found')
    }
  }catch(err){
    next(err);
  }
})

app.post('/api/auth', async(req, res, next)=> {
  try {
    //console.log(req.body);
    res.send({ token: await User.authenticate(req.body)});
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', async(req, res, next)=> {
  try {
    res.send(await User.byToken(req.headers.authorization));
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
