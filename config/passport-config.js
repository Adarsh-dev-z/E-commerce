const GoogleStrategy= require("passport-google-oauth20").Strategy;


function passportCongfig (passport){
    
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACKURL
  },
  (accessToken,refreshToken, profile, done)=>{
  
    console.log(profile)
    return done(null, profile);
  }
  ));

  passport.serializeUser((user,done)=>{
    done(null, user);
  })
  
  passport.deserializeUser((obj, done)=>{
    done(null, obj);
  });

}

module.exports= passportCongfig;