import dotenv from "dotenv"
import connectiondb from "./db/index.js";
dotenv.config({
    path: './.env'
})

connectiondb()









// (async()=>{
//     try {
//         await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
//         app.on('error',(error)=>{
//             console.log(error);
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`listening on ${process.env.PORT}`)
//         })
        
        
//     } catch (error) {
//         console.error(error)
        
//     }
// })()