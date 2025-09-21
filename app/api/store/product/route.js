import {getAuth} from "@clerk/nextjs/server";
import authSeller from "@/middleware/authSeller";
import imageKit from "@/configs/imageKit";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try{

        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error:'not authorized'},{status: 401})
        }

        //get the data from form
        const formData = await request.formData()
        const name = formData.get("name")
        const description = formData.get("description")
        const mrp = Number(formData.get("mrp"))
        const price = Number(formData.get("price"))
        const category = formData.get("category")
        const images = formData.get("images")

        if(!name || ! description || !mrp || !price || !category || images.lenght<1){
             return NextResponse.json({error:"missing product detail "},{status: 400})
        }

        //if these data is available upload the img 

        const imagesUrl = await Promise.all(images.map(async (image) => {
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imageKit.upload({
                file: buffer,
                fileName: image.name,
                folder: "products",
            })
            //img optimazation
            const url = imageKit.url({
                path: response.filePath,
                transformation:[
                    {quality:'auto'},
                    {format:'webp'},
                    {width:'1024'}
                ]

            })

            return url
        }))

        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId
            }
        })

        return NextResponse.json({message: "Product added successfully "})




    } catch(error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message},{status:400})
    }

    
}

//get products

export async function GET(request) {
    try{
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error:'not authorized'},{status: 401})
        }

        const products = await prisma.product.findMany({
            where: {storeId}})


         return NextResponse.json({products})

    } catch(error){
        console.error(error);
        return NextResponse.json({error: error.code || error.message},{status:400})

    }
    
}