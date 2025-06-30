const express = require('express');
const connectDb = require('./connection/db')
const cookieParser = require('cookie-parser');
const UserRoutes = require('./routes/user-routes');
const SubjectRoutes = require('./routes/subject-routes');
const DailyPlanRoutes = require('./routes/dailyPlan-routes');
const path = require('path');
require('dotenv').config();//must be at the top
connectDb();
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));


// Home Route
app.get('/', (req, res) => {
  res.render('home');
});
app.use('/api/user/',UserRoutes);
app.use('/api/subject/',SubjectRoutes);
app.use('/api/dailyPlan/',DailyPlanRoutes);


app.listen(PORT,()=>{
   console.log(`Server listening at ${PORT}`);
}) 