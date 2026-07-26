export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

interface PaymentPayload {
  amount: number; // in INR
  description: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
}

export async function checkoutWithRazorpay({
  amount,
  description,
  userEmail,
  userName,
  userPhone,
  onSuccess,
  onDismiss
}: PaymentPayload) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    alert("Razorpay payment gateway failed to load. Please check your internet connection.");
    if (onDismiss) onDismiss();
    return;
  }

  let orderId = "";
  try {
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, description })
    });
    
    if (!res.ok) {
      const bodyText = await res.text();
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          const err = JSON.parse(bodyText);
          throw new Error(err.error || 'Server error creating order');
        } catch (jsonErr) {
          throw new Error(`Server returned status ${res.status} (invalid JSON): ${bodyText.substring(0, 150)}`);
        }
      } else {
        throw new Error(`Server returned status ${res.status}: ${bodyText.substring(0, 150)}`);
      }
    }
    
    const data = await res.json();
    orderId = data.orderId;
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    const key = process.env.RAZORPAY_KEY_ID || "rzp_test_T521fyUDkQZJC4";
    const isLive = key.startsWith("rzp_live");
    if (isLive) {
      alert(`Payment Initialization Failed (Error 500): ${error.message || 'Server error'}`);
      if (onDismiss) onDismiss();
      return;
    }
    console.warn("Falling back to direct client-side payment flow (allowed in test/sandbox mode only).");
  }

  const options: any = {
    key: process.env.RAZORPAY_KEY_ID || "rzp_test_T521fyUDkQZJC4",
    amount: Math.round(amount * 100), // Razorpay accepts amount in paise (1 INR = 100 paise)
    currency: "INR",
    name: "Aaditya's Aura",
    description: description,
    image: "/logo.png",
    handler: function (response: any) {
      if (response.razorpay_payment_id) {
        onSuccess(response.razorpay_payment_id);
      } else {
        alert("Payment was successful, but no Transaction ID was returned by Razorpay.");
      }
    },
    prefill: {
      name: userName || "",
      email: userEmail || "",
      contact: userPhone || ""
    },
    theme: {
      color: "#bf953f" // Gold theme matching the site's brand
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      }
    }
  };

  if (orderId) {
    options.order_id = orderId;
  }

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
