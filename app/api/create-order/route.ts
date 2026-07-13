import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id:
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret:
    process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const amount = Number(body.amount || 0);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order amount.",
        },
        {
          status: 400,
        }
      );
    }

    const order =
      await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

    return NextResponse.json(
      {
        success: true,
        order,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "Create Razorpay order error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.error?.description ||
          error?.message ||
          "Unable to create Razorpay order.",
      },
      {
        status:
          error?.statusCode || 500,
      }
    );
  }
}