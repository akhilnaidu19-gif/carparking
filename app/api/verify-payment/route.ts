import crypto from "crypto";
import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id:
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret:
    process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = String(
      body.razorpayOrderId || ""
    ).trim();

    const paymentId = String(
      body.razorpayPaymentId || ""
    ).trim();

    const signature = String(
      body.razorpaySignature || ""
    ).trim();

    const expectedAmount = Number(
      body.expectedAmount || 0
    );

    if (
      !orderId ||
      !paymentId ||
      !signature
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing Razorpay payment verification details.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(expectedAmount) ||
      expectedAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid expected payment amount.",
        },
        {
          status: 400,
        }
      );
    }

    const secret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay secret is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(
          `${orderId}|${paymentId}`
        )
        .digest("hex");

    const signatureIsValid =
      crypto.timingSafeEqual(
        Buffer.from(
          generatedSignature
        ),
        Buffer.from(
          signature
        )
      );

    if (!signatureIsValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment signature verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    const payment =
      await razorpay.payments.fetch(
        paymentId
      );

    if (
      payment.order_id !== orderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment does not belong to this Razorpay order.",
        },
        {
          status: 400,
        }
      );
    }

    const expectedAmountInPaise =
      Math.round(
        expectedAmount * 100
      );

    if (
      Number(payment.amount) !==
      expectedAmountInPaise
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paid amount does not match the booking amount.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      payment.status !== "captured"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Payment is currently ${payment.status}. The payment must be captured before the booking is created.`,
          paymentStatus:
            payment.status,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Payment verified successfully.",

        payment: {
          id: payment.id,
          orderId:
            payment.order_id,
          status:
            payment.status,
          amount:
            Number(payment.amount) /
            100,
          currency:
            payment.currency,
          method:
            payment.method || "",
          captured:
            payment.captured,
          email:
            payment.email || "",
          contact:
            payment.contact || "",
        },
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "Payment verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.error?.description ||
          error?.message ||
          "Unable to verify payment.",
      },
      {
        status:
          error?.statusCode || 500,
      }
    );
  }
}