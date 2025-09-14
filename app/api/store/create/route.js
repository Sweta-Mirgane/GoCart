import {getAuth} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";
import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";


export async function POST(request) {
    try{
        const {userId} = getAuth(request)
        const formData = await request.formData()

        const name = formData.get("name")
        const username = formData.get("username")
        const description = formData.get("description")
        const email = formData.get("email")
        const contact = formData.get("contact")
        const address = formData.get("address")
        const image = formData.get("image")

        if(!name || !username || !description || !email ||
            !contact || !address || !image){
                return NextResponse.json({error: "missing store info"},{status: 400})
            }

            //check if user aleardy registred 
            const store = await prisma.store.findFirst({
                where:{userId: userId}
            })

            //if already registred then send status
            if(store){
                return NextResponse.json({status: store.status})
            }

            //check usernam is already taken
            const isUsernameTaken = await prisma.store.findFirst({
                where: {username: username.toLowerCase()}
            })
            if (isUsernameTaken){
                return NextResponse.json({error: "username already taken"},{status:400})
            }

            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imagekit.upload({
                file: buffer,
                fileName: image.name,
                folder: "logos"
            })


            const optimizedImage = imagekit.url({
                path: response.filePath,
                transformation:[
                    {quality:'auto'},
                    {format:'webp'},
                    {width:'512'}
                ]
            })

            const newStore = await prisma.store.create({
                data:{
                    userId,
                    name,
                    description,
                    username,
                    email,
                    contact,
                    address,
                    logo: optimizedImage
                }
            })

            //link store to the user
            await prisma.user.update({
                where: {id: userId},
                data: {store:{connect: {id:newStore.id}}}
            })
            return NextResponse.json({message: "applied,waiting for approval"})

    } catch(error){
        console.error(error);
         return NextResponse.json({error:error.code || error.message},{status:400})


    }
    
}

//if already registered a store then send status of store

export async function GET(request) {
    try{
        const {userId} = getAuth(request)
        //check if user aleardy registred 
            const store = await prisma.store.findFirst({
                where:{userId: userId}
            })

            //if already registred then send status
            if(store){
                return NextResponse.json({status: store.status})
            }

            return NextResponse.json({status:"not registered"})





    } catch(error){
        console.error(error);
         return NextResponse.json({error:error.code || error.message},{status:400})
    }
    
}