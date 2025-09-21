
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { authSeller } from '@/middleware/authSeller';


export async function POST(request) {
    try{
        const {userId} = getAuth(request)
        const {productId} = await request.json()

        if(!productId){
            return NextResponse.json({error: "missing deatils: productId"},{status:400});
        }

        const storeId = await authSeller(userId)
        if(!storeId){
            return NextResponse.json({error: "not authorized"},{status:401});
        }

        //product is available

        const product = await prisma.product.findFirst({
            where: {id: productId,storeId}
        })

        if(!product){
             return NextResponse.json({error: "product not found"},{status:404});

        }

        await prisma.product.update({
            where: {id: productId},
            data: {inStock: !product.inStock}
        })

        return NextResponse.json({message:"product stock updated successfully"})

    } catch(error){
        console.error(error);
        return NextResponse.json({error: error.code || error.message},{status:400});


    }
    
}