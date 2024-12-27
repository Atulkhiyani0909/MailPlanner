const mongoose=require("mongoose");



const userSchema=new mongoose.Schema({
   user:{
    type:String,
    required:true,
   },
   accountPassword:{
    type:String,
    required:true,
   },
             //have emails with there own password
      email: {
        type: String,
        required: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      },
      password: {
        type: String,
        required: true,
        trim: true,
      },
    
  sendmailID:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'email',
    }
  ],
  profilepic:{
    type: String,
    default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKUAAACUCAMAAADF0xngAAAAMFBMVEXh4eGjo6OgoKDk5OTc3NyoqKjKysrS0tLW1tatra3n5+ednZ20tLTHx8fDw8O6urrd+wF+AAADxklEQVR4nO2c25asKAxAgXBVkP//2wNaXeXUTbCDodewn9p+2osYCkKQscFgMBgMBoPB/5FpAialZDBN1CofAGZNVHxDRWPTf3oDbPBcCHGzzH/5YPvyBLmouyG/m6pF9uS5iJm/YxYLtdoPYP3zMO4G1PcRdtD8s2TS5LoHTf0+2Luwa2pFxsKBYyYQO4L+Fu171GmDDqbAMWMoNaUrtHSS0DKWxHuNeSRzBFsqmTTJpk34Mpu/WHoiy+LU2aBKoFhlSfRmSnWstkPRpHnRhP5AkPxQQvE0dLOMJC+mq7R0FJKyyjFD8WLaoxXbM7O9XhJMtSXBjAmHq98XS4L1G4RqyzAsP1j+iYj/jRxnsm5ST9M6yQ953WIjLTcoJGvWwOtQkqyDa5OcIsUTtkqSc4rkSVSFXHgaybK6xt2SrL5Rk+UkGZ6pyR+i3FkpXq7TLNRv2NKYK6IEX4GlLObzQlsaLNpIEm0fdxRMmlRT5Q7pD+vqnrJ4eQOOykXk4d4IX45SBHnp/wewH+dN4SinoGe0ezOegrsOjnp2gNT5SHevKLjXXR2WbtjgtiPn9QDahZ5ivQMmJo0OS9BGsqm/YXwAG9Qag8FgMBgMBlTcVkK5S3T32AtZR1oToneKizkjuHI+BmNlH7YwgdXJLy/Qn3YU+Tm5agukK2LYdhGCf93p5k1a3l2QmAJLY6j4XFQnmrlKY3q5aN4zqq99l6+Dqi7eU0rjX7qAi0yFNxfVjEAGd8px83ThggHN3dRVkX7x5M07r8HG08O4H9DYsDdv7Ur/tePq2XA8LZLj5tmmQCMre7EOPSN+uoOsbMUq0HToUdeI0b5rKtzy5kF//2lN1HsBlV2rNSD2a7WTTJpoluiJ8wDtGLX0sPEcWEeUxQe350Ca3pd28c7gXKfCn86fLFHuWLRM8A2ENK/rdDkDRnfM37BksrKfrVoS5fgcajvFasFZt0NoOZgCrdEIef37H0m8qyrtXk2cl/JHs8EaeJVEvU4DBmGD+0ZS4F4HSOvgBjsK9FteDfYULe4Zp98g5J1uk75RMKgpJFSjKyoWMeiiWTPzl+6maknXrp4FWFUYEVsWByFtLzAqg0vjEjtC1FtG+8Hyy1rwRR+3+M1wXtlEGE56CndlN+a52vX1X1xJnt8O9t4ock7xVRhg+Ss6xY4+kH0JyERVcBApZhXxCoAnAGYXx8XHqX49fV7oP6gEIG2I+fz+STU/KxeDlT2c49+aDYxe/P4bIc4vuaW1i1aDHTAlctdGhuWHvvwGg8FgMBgMBlfwDyX6JlWf1NmiAAAAAElFTkSuQmCC',
  }

})

module.exports = mongoose.model('User', userSchema);