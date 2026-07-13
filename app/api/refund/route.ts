import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paymentId = String(
      body.paymentId || ""
    ).trim();

    const amount = Number(
      body.amount || 0
    );

    const bookingId = String(
      body.bookingId || ""
    ).trim();

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay payment ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid refund amount is required.",
        },
        {
          status: 400,
        }
      );
    }

    const refundAmountInPaise =
      Math.round(amount * 100);

    const refund =
      await razorpay.payments.refund(
        paymentId,
        {
          amount:
            refundAmountInPaise,

          speed: "normal",

          notes: {
            bookingId:
              bookingId ||
              "Not Available",

            refundType:
              "Parking Amount Only",

            platformFeeRefunded:
              "false",
          },
        }
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Refund initiated successfully.",
        refund,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "Razorpay refund error:",
      error
    );

    const razorpayMessage =
      error?.error?.description ||
      error?.description ||
      error?.message ||
      "Unable to process refund.";

    return NextResponse.json(
      {
        success: false,
        message:
          razorpayMessage,
      },
      {
        status:
          error?.statusCode || 500,
      }
    );
  }
}