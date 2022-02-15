const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const { STRING } = Sequelize;
const bcrypt = require('bcrypt')

const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

const Note = conn.define('note', {
  text: STRING,
})

Note.belongsTo(User)
User.hasMany(Note)

const hashPassword = async (password) => {
  const SALT_COUNT = 5
  const hashedPWD = await bcrypt.hash(password, SALT_COUNT)
  return hashedPWD;
}

User.beforeCreate(async (user) => {
  const hashPass = await hashPassword(user.password)
  console.log(hashPass)
  user.password = hashPass;
})

User.byToken = async(token)=> {
  try {
    const verify = jwt.verify(token, process.env.JWT)
    if(verify) {
      return await User.findByPk(verify.userId);
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username
    }
  });
  if(user){
    if(await bcrypt.compare(password, user.password)){
      return jwt.sign({userId: user.id}, process.env.JWT);
    }
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const notes = [
    {text: 'Hello World'},
    {text: 'Task note for moe'},
    {text: 'Love letter for lucy'},
  ]
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  const [welcome, task, letter] = await Promise.all(
    notes.map(note => Note.create(note))
  )
  await moe.setNotes([welcome, task])
  await lucy.setNotes(letter)

  console.log("database seeded");
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};
